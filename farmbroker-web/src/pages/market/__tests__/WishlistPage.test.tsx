import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

import { WishlistPage } from '@/pages/market/WishlistPage';
import { addWishlist } from '@/services/wishlistService';
import { renderWithProviders } from '@/test/renderWithProviders';

// 찜 목록 화면의 핵심 동작을 목업 서비스 위에서 검증한다.
// 결제는 여기서 하지 않는다 — 거래는 채팅으로 하고, 바로 살 때는 상세로 들어간다.
describe('WishlistPage', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it('찜한 게 없으면 빈 상태를 보여준다', async () => {
    renderWithProviders(<WishlistPage />, { route: '/market/wishlist' });

    expect(
      await screen.findByRole('heading', { name: '찜한 상품이 없습니다' }),
    ).toBeInTheDocument();
  });

  it('찜한 상품과 단가를 보여준다', async () => {
    await addWishlist(1);
    renderWithProviders(<WishlistPage />, { route: '/market/wishlist' });

    expect(await screen.findByText('버터헤드 상추')).toBeInTheDocument();
    expect(screen.getByText(/₩4,300/)).toBeInTheDocument();
  });

  // 찜은 관심 목록이므로 결제로 이어지는 요소가 없어야 한다.
  it('수량 조절이나 결제 버튼을 두지 않는다', async () => {
    await addWishlist(1);
    renderWithProviders(<WishlistPage />, { route: '/market/wishlist' });

    await screen.findByText('버터헤드 상추');
    expect(screen.queryByRole('button', { name: /결제/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /수량/i })).not.toBeInTheDocument();
  });

  it('찜 해제를 누르면 목록에서 사라진다', async () => {
    const user = userEvent.setup();
    await addWishlist(1);
    renderWithProviders(<WishlistPage />, { route: '/market/wishlist' });

    await screen.findByText('버터헤드 상추');
    await user.click(screen.getByRole('button', { name: /찜 해제/i }));

    expect(
      await screen.findByRole('heading', { name: '찜한 상품이 없습니다' }),
    ).toBeInTheDocument();
  });
});
