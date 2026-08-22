import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MyProductsPage } from '@/pages/market/MyProductsPage';
import { getMyProducts, updateProduct } from '@/services/marketService';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { MarketItem } from '@/types/api';

vi.mock('@/services/marketService', () => ({
  deleteProduct: vi.fn(),
  getMyProducts: vi.fn(),
  updateProduct: vi.fn(),
}));

function closedProduct(productId: number, name: string, stock: number): MarketItem {
  return {
    productId,
    name,
    category: '잎채소',
    productionLocation: '장전 스마트팜',
    producerName: '어반리프',
    harvestDate: '2026-08-08',
    price: 4300,
    unit: '200g',
    imageUrl: null,
    freshnessTags: [],
    foodMileageKm: null,
    stock,
    status: 'CLOSED',
  };
}

describe('MyProductsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('재고가 있는 마감 상품만 판매를 재개한다', async () => {
    const user = userEvent.setup();
    const soldOut = closedProduct(1, '재고 없는 상추', 0);
    const restocked = closedProduct(2, '재고 보충한 상추', 5);
    vi.mocked(getMyProducts).mockResolvedValue([soldOut, restocked]);
    vi.mocked(updateProduct).mockResolvedValue({ ...restocked, status: 'ON_SALE' });

    renderWithProviders(<MyProductsPage />);

    await screen.findByText('재고 없는 상추');
    const registrationLink = screen.getByRole('link', { name: '상품 등록' });
    expect(registrationLink).toHaveClass('min-h-11');
    expect(registrationLink.querySelector('svg')).toHaveClass('h-5', 'w-5');
    expect(screen.getAllByRole('button', { name: '판매 재개' })).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: '판매 재개' }));

    await waitFor(() =>
      expect(updateProduct).toHaveBeenCalledWith(2, { status: 'ON_SALE' }),
    );
  });
});
