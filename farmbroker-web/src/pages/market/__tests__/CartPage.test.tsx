import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

import { CartPage } from '@/pages/market/CartPage';
import { addToCart } from '@/services/cartService';
import { renderWithProviders } from '@/test/renderWithProviders';

// 장바구니 화면의 핵심 동작을 목업 서비스 위에서 검증한다.
// 결제까지 태우면 목업 상품 재고가 실제로 줄어드는 것도 함께 확인한다.
describe('CartPage', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it('담은 게 없으면 빈 상태를 보여준다', async () => {
    renderWithProviders(<CartPage />, { route: '/market/cart' });

    expect(
      await screen.findByRole('heading', { name: '장바구니가 비어 있습니다' }),
    ).toBeInTheDocument();
  });

  it('담은 상품과 결제 예정 금액을 보여준다', async () => {
    await addToCart(1, 2);
    renderWithProviders(<CartPage />, { route: '/market/cart' });

    expect(await screen.findByText('버터헤드 상추')).toBeInTheDocument();
    // 4,300원 × 2
    expect(
      await screen.findByRole('button', { name: /₩8,600 결제하기/i }),
    ).toBeInTheDocument();
  });

  it('수량을 늘리면 결제 금액이 따라 오른다', async () => {
    const user = userEvent.setup();
    await addToCart(1, 1);
    renderWithProviders(<CartPage />, { route: '/market/cart' });

    await screen.findByText('버터헤드 상추');
    await user.click(screen.getByRole('button', { name: /수량 늘리기/i }));

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /₩8,600 결제하기/i })).toBeInTheDocument(),
    );
  });

  it('빼기를 누르면 장바구니에서 사라진다', async () => {
    const user = userEvent.setup();
    await addToCart(1, 1);
    renderWithProviders(<CartPage />, { route: '/market/cart' });

    await screen.findByText('버터헤드 상추');
    await user.click(screen.getByRole('button', { name: /빼기/i }));

    expect(
      await screen.findByRole('heading', { name: '장바구니가 비어 있습니다' }),
    ).toBeInTheDocument();
  });
});
