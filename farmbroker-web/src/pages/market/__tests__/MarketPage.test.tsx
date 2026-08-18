import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { renderWithProviders } from '@/test/renderWithProviders';
import { MarketPage } from '@/pages/market/MarketPage';
import { ProductDetailPage } from '@/pages/market/ProductDetailPage';
import { getWishlist } from '@/services/wishlistService';
import type { Wishlist } from '@/types/api';

vi.mock('@/services/wishlistService', () => ({
  getWishlist: vi.fn(),
  addWishlist: vi.fn(),
  removeWishlist: vi.fn(),
  createOrder: vi.fn(),
}));

const emptyWishlist: Wishlist = { items: [] };

function wishlistWith(productId: number, name: string): Wishlist {
  return {
    items: [
      { productId, name, unit: '200g', price: 4300, imageUrl: null, stock: 24, purchasable: true },
    ],
  };
}

describe('Market pages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getWishlist).mockResolvedValue(emptyWishlist);
  });

  it('마켓 상품과 카테고리 상호작용을 렌더링한다', async () => {
    const user = userEvent.setup();
    renderWithProviders(<MarketPage />);

    expect(await screen.findByText('버터헤드 상추')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '허브' }));

    await waitFor(() => {
      expect(screen.getByText('바질')).toBeInTheDocument();
    });
  });

  it('수량 변경 시 바로 구매 버튼의 금액을 갱신한다', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ProductDetailPage />, { route: '/market/1' });

    expect(
      await screen.findByRole('heading', { name: '버터헤드 상추' }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /수량 늘리기/i }));

    expect(
      screen.getByRole('button', { name: /₩8,600 바로 구매/i }),
    ).toBeInTheDocument();
  });

  // 목록이 찜 상태를 모르면 이미 찜한 상품도 빈 하트로 보이고, 해제하려면 두 번 눌러야 한다.
  it('이미 찜한 상품은 목록에서도 채워진 하트로 보인다', async () => {
    vi.mocked(getWishlist).mockResolvedValue(wishlistWith(1, '버터헤드 상추'));
    renderWithProviders(<MarketPage />, { authenticated: true });

    const wished = await screen.findByRole('button', { name: '버터헤드 상추 찜 해제' });
    expect(wished).toHaveAttribute('aria-pressed', 'true');
    // 찜하지 않은 상품은 그대로 빈 하트다.
    expect(screen.getByRole('button', { name: '바질 찜하기' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('비로그인이면 찜 목록을 부르지 않는다', async () => {
    renderWithProviders(<MarketPage />);

    await screen.findByText('버터헤드 상추');
    expect(getWishlist).not.toHaveBeenCalled();
  });
});
