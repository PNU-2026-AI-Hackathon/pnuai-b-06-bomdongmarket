import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';

import { AuthContext } from '@/auth/authContext';

const AUTH_SESSION_KEY = 'farmbroker.authenticated';

interface AuthProviderProps {
  children: ReactNode;
  initialAuthenticated?: boolean;
}

function readStoredSession() {
  return window.sessionStorage.getItem(AUTH_SESSION_KEY) === 'true';
}

// 실제 인증 API가 연결되기 전까지 현재 탭의 로그인 상태를 유지하는 데모 Provider입니다.
export function AuthProvider({ children, initialAuthenticated }: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => initialAuthenticated ?? readStoredSession(),
  );

  const value = useMemo(
    () => ({
      isAuthenticated,
      login: () => {
        window.sessionStorage.setItem(AUTH_SESSION_KEY, 'true');
        setIsAuthenticated(true);
      },
    }),
    [isAuthenticated],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
