import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { resolveReturnLocation } from '@/auth/redirect';
import { useAuth } from '@/auth/authContext';
import { ROUTES } from '@/constants/routes';

// 로그인한 사용자가 로그인·회원가입 화면으로 되돌아가지 않도록 보호합니다.
export function GuestOnlyRoute() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (isAuthenticated) {
    return <Navigate replace to={resolveReturnLocation(location.state, ROUTES.home)} />;
  }

  return <Outlet />;
}
