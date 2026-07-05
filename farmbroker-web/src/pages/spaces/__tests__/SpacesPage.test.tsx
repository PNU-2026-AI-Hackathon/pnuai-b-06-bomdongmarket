import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { renderWithProviders } from '../../../test/renderWithProviders';
import { SpaceList } from '../components/SpaceList';
import { SpacesPage } from '../SpacesPage';

describe('SpacesPage', () => {
  it('renders available spaces from the mock service', async () => {
    renderWithProviders(<SpacesPage />);

    expect(screen.getByText(/loading available spaces/i)).toBeInTheDocument();
    expect(
      await screen.findByText(/jangjeon-dong 20 pyeong retail space/i),
    ).toBeInTheDocument();
  });

  it('filters spaces by keyword', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SpacesPage />);

    await screen.findByText(/jangjeon-dong 20 pyeong retail space/i);
    await user.type(screen.getByRole('textbox', { name: /search spaces/i }), 'Seomyeon');

    await waitFor(() => {
      expect(screen.getByText(/seomyeon basement grow room/i)).toBeInTheDocument();
    });
  });

  it('shows empty and error states', () => {
    const { rerender } = renderWithProviders(
      <SpaceList error={null} onRetry={() => undefined} spaces={[]} status="success" />,
    );

    expect(screen.getByText(/no spaces found/i)).toBeInTheDocument();

    rerender(
      <SpaceList
        error="Network down"
        onRetry={() => undefined}
        spaces={[]}
        status="error"
      />,
    );
    expect(screen.getByText(/network down/i)).toBeInTheDocument();
  });
});
