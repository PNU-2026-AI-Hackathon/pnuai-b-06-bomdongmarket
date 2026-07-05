import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { renderWithProviders } from '../../../test/renderWithProviders';
import { ContractsPage } from '../ContractsPage';
import { DashboardPage } from '../DashboardPage';
import { MyPage } from '../MyPage';

describe('Dashboard pages', () => {
  it('renders metrics, matching requests, and contract preview', async () => {
    renderWithProviders(<DashboardPage />);

    expect(await screen.findByText('Registered Spaces')).toBeInTheDocument();
    expect(screen.getByText(/received matching requests/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Urban Farmer Kim/i).length).toBeGreaterThan(0);
  });

  it('renders contract cards and responds to status tab clicks', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ContractsPage />);

    expect(await screen.findByText(/jangjeon retail space/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Complete' }));
    expect(screen.getByText(/seomyeon grow room/i)).toBeInTheDocument();
  });

  it('renders my page profile menu', () => {
    renderWithProviders(<MyPage />);

    expect(screen.getByText('Green Space Lab')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /help center/i })).toBeInTheDocument();
  });
});
