import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { renderWithProviders } from '@/test/renderWithProviders';
import { MarketPage } from '@/pages/market/MarketPage';
import { ProductDetailPage } from '@/pages/market/ProductDetailPage';

describe('Market pages', () => {
  it('마켓 상품과 카테고리 상호작용을 렌더링한다', async () => {
    const user = userEvent.setup();
    renderWithProviders(<MarketPage />);

    expect(await screen.findByText('버터헤드 상추')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '허브' }));

    await waitFor(() => {
      expect(screen.getByText('바질')).toBeInTheDocument();
    });
  });

  it('수량 변경 시 구매 금액을 갱신한다', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ProductDetailPage />, { route: '/market/1' });

    expect(
      await screen.findByRole('heading', { name: '버터헤드 상추' }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /수량 늘리기/i }));

    expect(screen.getByRole('button', { name: /₩8,600 구매하기/i })).toBeInTheDocument();
  });
});
