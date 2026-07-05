import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { renderWithProviders } from '../../../test/renderWithProviders';
import { MarketPage } from '../MarketPage';
import { ProductDetailPage } from '../ProductDetailPage';

describe('Market pages', () => {
  it('renders market products and category interactions', async () => {
    const user = userEvent.setup();
    renderWithProviders(<MarketPage />);

    expect(await screen.findByText('Butterhead Lettuce')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Herbs' }));

    await waitFor(() => {
      expect(screen.getByText('Basil')).toBeInTheDocument();
    });
  });

  it('updates purchase total when quantity changes', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ProductDetailPage />, { route: '/market/1' });

    expect(
      await screen.findByRole('heading', { name: 'Butterhead Lettuce' }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /increase quantity/i }));

    expect(screen.getByRole('button', { name: /purchase ₩8,600/i })).toBeInTheDocument();
  });
});
