import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { renderWithProviders } from '../../../test/renderWithProviders';
import { LoginPage } from '../LoginPage';

describe('LoginPage', () => {
  it('renders role cards and login form', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    expect(screen.getByText('Space Owner')).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toHaveValue('owner@example.com');

    await user.click(screen.getByText('Urban Farmer'));
    expect(screen.getByText('Urban Farmer')).toBeInTheDocument();
  });
});
