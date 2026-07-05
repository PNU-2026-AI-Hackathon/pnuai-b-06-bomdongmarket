import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { mockSpaces } from '../../../mocks/mockSpaces';
import { renderWithProviders } from '../../../test/renderWithProviders';
import { SpaceCard } from '../components/SpaceCard';

describe('SpaceCard', () => {
  it('displays space summary props and detail link', () => {
    const space = mockSpaces[0];

    renderWithProviders(<SpaceCard space={space} />);

    expect(screen.getByText(space.title)).toBeInTheDocument();
    expect(screen.getByText('AVAILABLE')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /view details/i })).toHaveAttribute(
      'href',
      `/spaces/${space.spaceId}`,
    );
  });
});
