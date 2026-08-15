import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { saveAuthSession } from '@/auth/session';
import { ProductFormPage } from '@/pages/market/ProductFormPage';
import { deleteImage } from '@/services/fileService';
import { getMarketItem, updateProduct } from '@/services/marketService';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { MarketItem } from '@/types/api';

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
});
