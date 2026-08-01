import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { createReturnLocation } from '@/auth/redirect';
import { useAuth } from '@/auth/authContext';
import { ROUTES } from '@/constants/routes';

export function useRequireAuth() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  return useCallback(
    (onAuthorized?: () => void) => {
      if (!isAuthenticated) {
        navigate(ROUTES.login, {
          state: { from: createReturnLocation(location) },
        });
        return false;
      }

      onAuthorized?.();
      return true;
    },
    [isAuthenticated, location, navigate],
  );
}
