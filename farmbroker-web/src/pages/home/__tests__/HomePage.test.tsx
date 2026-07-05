import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderWithProviders } from '../../../test/renderWithProviders';
import { HomePage } from '../HomePage';
import { roleCards } from '../constants/homeContent';

describe('HomePage', () => {
  it('renders onboarding copy and role constants', () => {
    renderWithProviders(<HomePage />);

    expect(
      screen.getByRole('heading', {
        name: /turn unused spaces into urban smart farms/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /get started/i })).toBeInTheDocument();

    roleCards.forEach((role) => {
      expect(screen.getByText(role.label)).toBeInTheDocument();
    });
  });
});
