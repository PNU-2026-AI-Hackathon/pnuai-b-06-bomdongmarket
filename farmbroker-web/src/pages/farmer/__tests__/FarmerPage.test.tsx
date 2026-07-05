import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { renderWithProviders } from '../../../test/renderWithProviders';
import { FarmerPage } from '../FarmerPage';
import { ProfitPredictionPage } from '../ProfitPredictionPage';

describe('Farmer pages', () => {
  it('renders recommended spaces and supports keyword filtering', async () => {
    const user = userEvent.setup();
    renderWithProviders(<FarmerPage />);

    expect(await screen.findByText(/94% fit/i)).toBeInTheDocument();
    await user.type(
      screen.getByRole('textbox', { name: /search recommended spaces/i }),
      'Seomyeon',
    );

    await waitFor(() => {
      expect(screen.getByText(/seomyeon basement grow room/i)).toBeInTheDocument();
    });
  });

  it('renders prediction metrics and CTAs', () => {
    renderWithProviders(<ProfitPredictionPage />);

    expect(screen.getByText(/expected monthly revenue/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save result/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /request matching/i })).toBeInTheDocument();
  });
});
