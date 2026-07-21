import { render, type RenderOptions } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router-dom';

import { AuthProvider } from '@/auth/AuthProvider';

interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  authenticated?: boolean;
  route?: string;
}

export function renderWithProviders(
  ui: ReactElement,
  { authenticated, route = '/', ...options }: RenderWithProvidersOptions = {},
) {
  window.history.pushState({}, 'Test page', route);

  return render(ui, {
    wrapper: ({ children }) => (
      <MemoryRouter initialEntries={[route]}>
        <AuthProvider initialAuthenticated={authenticated}>{children}</AuthProvider>
      </MemoryRouter>
    ),
    ...options,
  });
}
