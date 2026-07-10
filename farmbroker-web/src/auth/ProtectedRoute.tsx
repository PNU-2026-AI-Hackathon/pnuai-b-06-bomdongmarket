import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { createReturnLocation } from '@/auth/redirect';
import { useAuth } from '@/auth/authContext';
import { ROUTES } from '@/constants/routes';

export function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return (
      <Navigate
        replace
        state={{ from: createReturnLocation(location) }}
        to={ROUTES.login}
      />
    );
  }

  return <Outlet />;
}
