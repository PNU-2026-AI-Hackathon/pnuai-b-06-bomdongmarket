import type { Location, To } from 'react-router-dom';

interface ReturnLocation {
  pathname: string;
  search?: string;
  hash?: string;
}

interface LoginLocationState {
  from?: ReturnLocation;
}

export function createReturnLocation(location: Location): ReturnLocation {
  return {
    pathname: location.pathname,
    search: location.search,
    hash: location.hash,
  };
}

export function resolveReturnLocation(state: unknown, fallback: To): To {
  const from = (state as LoginLocationState | null)?.from;

  if (
    typeof from?.pathname !== 'string' ||
    !from.pathname.startsWith('/') ||
    from.pathname.startsWith('//')
  ) {
    return fallback;
  }

  return from;
}
