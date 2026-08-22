import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { clearAuthSession, saveAuthSession } from '@/auth/session';
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
    clearAuthSession();
    vi.mocked(getWishlist).mockResolvedValue(emptyWishlist);
  });

  it('마켓 상품과 카테고리 상호작용을 렌더링한다', async () => {
    const user = userEvent.setup();
    renderWithProviders(<MarketPage />);

    expect(await screen.findByText('버터헤드 상추')).toBeInTheDocument();
    const registrationLink = screen.getByRole('link', { name: '상품 등록' });
    expect(registrationLink).toHaveClass('min-h-11');
    expect(registrationLink.querySelector('svg')).toHaveClass('h-5', 'w-5');
    await user.click(screen.getByRole('button', { name: '허브' }));

    await waitFor(() => {
      expect(screen.getByText('바질')).toBeInTheDocument();
    });
  });

  it('수량 변경 시 거래 버튼의 금액을 갱신한다', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ProductDetailPage />, { route: '/market/1' });

    expect(
      await screen.findByRole('heading', { name: '버터헤드 상추' }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /수량 늘리기/i }));

    expect(
      screen.getByRole('button', { name: /₩8,600에 거래하기/i }),
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

  // 자기 상품을 사면 재고만 줄고 거래는 없다. 서버도 막지만 버튼부터 감춘다.
  it('내가 등록한 상품에는 구매·채팅 버튼을 두지 않는다', async () => {
    saveAuthSession({
      userId: 9,
      email: 'seller@example.com',
      nickname: '어반리프',
      roles: ['FARMER'],
    });
    renderWithProviders(<ProductDetailPage />, { route: '/market/1', authenticated: true });

    expect(await screen.findByText('내가 등록한 상품입니다')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /거래하기/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '판매자와 채팅' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: '판매 관리로 이동' })).toBeInTheDocument();
  });

  it('다른 사람의 상품에는 거래 버튼을 그대로 둔다', async () => {
    saveAuthSession({
      userId: 77,
      email: 'buyer@example.com',
      nickname: '지역소비자',
      roles: ['CONSUMER'],
    });
    renderWithProviders(<ProductDetailPage />, { route: '/market/1', authenticated: true });

    expect(await screen.findByRole('button', { name: /거래하기/i })).toBeInTheDocument();
    expect(screen.queryByText('내가 등록한 상품입니다')).not.toBeInTheDocument();
  });

  it('비로그인이면 찜 목록을 부르지 않는다', async () => {
    renderWithProviders(<MarketPage />);

    await screen.findByText('버터헤드 상추');
    expect(getWishlist).not.toHaveBeenCalled();
  });
});
