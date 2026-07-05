import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { renderWithProviders } from '../../../test/renderWithProviders';
import { SpaceDetailPage } from '../SpaceDetailPage';

describe('SpaceDetailPage', () => {
  it('loads detail data and runs AI recommendation', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SpaceDetailPage />, { route: '/spaces/1' });

    expect(
      await screen.findByRole('heading', {
        name: /jangjeon-dong 20 pyeong retail space/i,
      }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /run ai recommendation/i }));
    expect(await screen.findByText(/layout suggestion/i)).toBeInTheDocument();
    expect(screen.getAllByText(/butterhead lettuce/i).length).toBeGreaterThan(0);
  });
});
