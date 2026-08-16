import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { saveAuthSession } from '@/auth/session';
import { ProductFormPage } from '@/pages/market/ProductFormPage';
import { deleteImage } from '@/services/fileService';
import { createProduct, getMarketItem, updateProduct } from '@/services/marketService';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { MarketItem } from '@/types/api';
import { geocodeAddress } from '@/utils/geocode';

vi.mock('@/pages/market/hooks/useMyWorkplaces', () => ({
  useMyWorkplaces: () => ({ workplaces: [], isLoading: false }),
}));

vi.mock('@/services/marketService', () => ({
  createProduct: vi.fn(),
  getMarketItem: vi.fn(),
  updateProduct: vi.fn(),
}));

vi.mock('@/services/fileService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/fileService')>();
  return { ...actual, deleteImage: vi.fn() };
});

vi.mock('@/utils/geocode', async () => {
  const actual = await vi.importActual<typeof import('@/utils/geocode')>('@/utils/geocode');
  return { ...actual, geocodeAddress: vi.fn().mockResolvedValue({ lat: 35.18, lng: 129.076 }) };
});

const existingProduct: MarketItem = {
  productId: 10,
  name: '버터헤드 상추',
  category: '잎채소',
  productionLocation: '장전 스마트팜',
  producerName: '어반리프',
  harvestDate: '2026-08-08',
  price: 4300,
  unit: '200g',
  imageUrl: '/files/1234567890abcdef1234567890abcdef.jpg',
  freshnessTags: [],
  foodMileageKm: null,
  stock: 3,
  status: 'ON_SALE',
};

describe('ProductFormPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.sessionStorage.clear();
    saveAuthSession({
      userId: 1,
      email: 'farmer@example.com',
      nickname: '어반리프',
      roles: ['CONSUMER', 'FARMER'],
    });
    vi.mocked(getMarketItem).mockResolvedValue(existingProduct);
  });

  async function removeImageAndSubmit() {
    const user = userEvent.setup();
    renderWithProviders(
      <Routes>
        <Route element={<ProductFormPage />} path="/market/:productId/edit" />
      </Routes>,
      {
        authenticated: true,
        route: '/market/10/edit',
      },
    );

    await screen.findByRole('heading', { name: '상품 수정' });
    await user.click(screen.getByRole('button', { name: '대표 사진 삭제' }));
    await user.click(screen.getByRole('button', { name: '수정 내용 저장' }));
  }

  it('사진을 비우고 저장하면 removeImageUrl만 전송한다', async () => {
    vi.mocked(updateProduct).mockResolvedValue({ ...existingProduct, imageUrl: null });

    await removeImageAndSubmit();

    await waitFor(() => expect(updateProduct).toHaveBeenCalledTimes(1));
    const payload = vi.mocked(updateProduct).mock.calls[0][1];
    expect(payload).toMatchObject({ removeImageUrl: true });
    expect(payload).not.toHaveProperty('imageUrl');
    await waitFor(() => expect(deleteImage).toHaveBeenCalledWith(existingProduct.imageUrl));
  });

  it('저장이 성공하기 전에는 버린 사진을 삭제하지 않는다', async () => {
    let resolveUpdate!: (item: MarketItem) => void;
    vi.mocked(updateProduct).mockReturnValue(
      new Promise((resolve) => {
        resolveUpdate = resolve;
      }),
    );

    await removeImageAndSubmit();

    await waitFor(() => expect(updateProduct).toHaveBeenCalledTimes(1));
    expect(deleteImage).not.toHaveBeenCalled();

    resolveUpdate({ ...existingProduct, imageUrl: null });
    await waitFor(() => expect(deleteImage).toHaveBeenCalledWith(existingProduct.imageUrl));
  });

  it('저장이 실패하면 버린 사진을 삭제하지 않는다', async () => {
    vi.mocked(updateProduct).mockRejectedValue(new Error('상품 수정에 실패했습니다.'));

    await removeImageAndSubmit();

    expect(await screen.findByRole('alert')).toHaveTextContent('상품 수정에 실패했습니다.');
    expect(deleteImage).not.toHaveBeenCalled();
  });

  it('등록 시 생산지 주소를 지오코딩해 좌표를 함께 전송한다', async () => {
    vi.mocked(createProduct).mockResolvedValue({ ...existingProduct, productId: 20 });

    const user = userEvent.setup();
    renderWithProviders(
      <Routes>
        <Route element={<ProductFormPage />} path="/market/new" />
      </Routes>,
      {
        authenticated: true,
        route: '/market/new',
      },
    );

    await screen.findByRole('heading', { name: '상품 등록' });

    await user.type(screen.getByLabelText('상품명'), '버터헤드 상추');
    await user.type(screen.getByLabelText('한 번에 파는 양'), '200');
    await user.type(screen.getByLabelText('가격(원)'), '4300');
    await user.type(screen.getByLabelText('재고 수량'), '24');
    await user.type(screen.getByLabelText('수확일'), '2026-08-08');
    await user.type(screen.getByLabelText('생산 위치'), '장전 스마트팜');
    await user.type(screen.getByLabelText('생산지 주소'), '부산광역시 금정구 장전동 30');

    await user.click(screen.getByRole('button', { name: '상품 등록하기' }));

    await waitFor(() => expect(createProduct).toHaveBeenCalledTimes(1));
    const payload = vi.mocked(createProduct).mock.calls[0][0];
    expect(payload).toMatchObject({ latitude: 35.18, longitude: 129.076 });
  });

  it('수정 시 주소 지오코딩이 실패하면 저장을 막고 안내한다', async () => {
    // 백엔드 PATCH는 null 좌표를 '변경 없음'으로 보므로, 주소만 바뀌고 좌표가 이전 값으로
    // 남는 불일치를 막기 위해 좌표를 못 구하면 저장하지 않는다.
    vi.mocked(geocodeAddress).mockResolvedValueOnce(null);

    const user = userEvent.setup();
    renderWithProviders(
      <Routes>
        <Route element={<ProductFormPage />} path="/market/:productId/edit" />
      </Routes>,
      { authenticated: true, route: '/market/10/edit' },
    );

    await screen.findByRole('heading', { name: '상품 수정' });
    const addressInput = screen.getByLabelText('생산지 주소');
    await user.clear(addressInput);
    await user.type(addressInput, '부산광역시 금정구 새 주소 45');
    await user.click(screen.getByRole('button', { name: '수정 내용 저장' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('좌표를 확인하지 못했습니다');
    expect(updateProduct).not.toHaveBeenCalled();
  });
});
