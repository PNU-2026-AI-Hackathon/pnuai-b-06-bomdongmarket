import { screen } from '@testing-library/react';
import { useLocation } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { AppRouter } from '@/app/router';
import { renderWithProviders } from '@/test/renderWithProviders';

function LocationProbe() {
  const location = useLocation();
  return <output>{location.pathname}</output>;
}

describe('farmer legacy route', () => {
  it('replaces /farmer with the canonical spaces route', async () => {
    renderWithProviders(
      <>
        <AppRouter />
        <LocationProbe />
      </>,
      { route: '/farmer' },
    );

    expect(
      await screen.findByRole('heading', {
        name: /스마트팜으로 전환 가능한 도심 공간 찾기/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('/spaces')).toBeInTheDocument();
  });
});
