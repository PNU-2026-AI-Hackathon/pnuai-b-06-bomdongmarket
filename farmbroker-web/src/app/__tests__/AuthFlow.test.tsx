import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { AppRouter } from '@/app/router';
import { renderWithProviders } from '@/test/renderWithProviders';

async function login(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/이메일/i), 'owner@example.com');
  await user.type(screen.getByLabelText(/비밀번호/i), '12345678');
  await user.click(screen.getByRole('button', { name: '로그인' }));
}

describe('인증 후 원래 위치 복귀', () => {
  it('보호된 공간 등록 페이지에서 로그인 후 원래 페이지로 돌아온다', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AppRouter />, { route: '/spaces/new' });

    expect(
      await screen.findByRole('heading', { name: '봄동마켓 로그인' }),
    ).toBeInTheDocument();

    await login(user);

    expect(
      await screen.findByRole('heading', { name: '새 재배 공간 등록' }),
    ).toBeInTheDocument();
  });

  it('비로그인 구매 요청을 로그인으로 보내고 상품 상세로 복귀시킨다', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AppRouter />, { route: '/market/1' });

    const purchaseButton = await screen.findByRole('button', { name: /구매하기/i });
    await user.click(purchaseButton);

    expect(
      await screen.findByRole('heading', { name: '봄동마켓 로그인' }),
    ).toBeInTheDocument();

    await login(user);

    expect(
      await screen.findByRole('heading', { name: '버터헤드 상추' }),
    ).toBeInTheDocument();
  });

  it('비로그인 장바구니 담기를 로그인으로 보내고 마켓으로 복귀시킨다', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AppRouter />, { route: '/market' });

    const addToCartButton = await screen.findByRole('button', {
      name: '버터헤드 상추 담기',
    });
    await user.click(addToCartButton);

    expect(
      await screen.findByRole('heading', { name: '봄동마켓 로그인' }),
    ).toBeInTheDocument();

    await login(user);

    expect(
      await screen.findByRole('heading', {
        name: '가까운 스마트팜에서 온 신선한 농산물',
      }),
    ).toBeInTheDocument();
  });

  it('로그인 상태에서는 대시보드를 바로 보여준다', async () => {
    renderWithProviders(<AppRouter />, { authenticated: true, route: '/dashboard' });

    expect(await screen.findByText('등록 공간')).toBeInTheDocument();
  });
});
