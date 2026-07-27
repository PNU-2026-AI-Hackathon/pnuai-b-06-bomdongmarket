import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';

import { AuthContext } from '@/auth/authContext';
import {
  AUTH_SESSION_CHANGED_EVENT,
  clearAuthSession,
  getAccessToken,
  getStoredUser,
  saveAuthSession,
  updateStoredUser,
} from '@/auth/session';
import { getCurrentUser, login as requestLogin } from '@/services/authService';
import type { LoginInput, User } from '@/types/api';

interface AuthProviderProps {
  children: ReactNode;
  initialAuthenticated?: boolean;
}

export function AuthProvider({ children, initialAuthenticated }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(() => getStoredUser());
  const [isAuthenticated, setIsAuthenticated] = useState(() =>
    initialAuthenticated === undefined ? Boolean(getAccessToken()) : initialAuthenticated,
  );

  useEffect(() => {
    function syncSession() {
      setIsAuthenticated(Boolean(getAccessToken()));
      setUser(getStoredUser());
    }

    window.addEventListener(AUTH_SESSION_CHANGED_EVENT, syncSession);
    return () => window.removeEventListener(AUTH_SESSION_CHANGED_EVENT, syncSession);
  }, []);

  useEffect(() => {
    // 로그인 응답에서 토큰과 사용자를 함께 저장하므로 일반적인 새로고침에서는
    // 저장된 사용자로 즉시 복원합니다. 직접 URL(/signup 등) 접근 때마다 /users/me를
    // 다시 호출하면 해당 요청의 실패가 정상 세션을 지우는 원인이 될 수 있습니다.
    if (!getAccessToken() || getStoredUser()) return;

    void getCurrentUser()
      .then((currentUser) => {
        updateStoredUser(currentUser);
        setUser(currentUser);
      })
      // 401 응답은 apiRequest가 세션을 정리합니다. 네트워크 오류나 일시적인
      // 서버 장애까지 로그아웃으로 취급하면 새로고침·직접 URL 접근 직후
      // 헤더가 비로그인 상태로 바뀌므로 저장된 세션은 그대로 유지합니다.
      .catch(() => undefined);
  }, []);

  const value = useMemo(
    () => ({
      isAuthenticated,
      user,
      login: async (input: LoginInput) => {
        const result = await requestLogin(input);
        saveAuthSession(result);
        setUser(result.user);
        setIsAuthenticated(true);
        return result.user;
      },
      logout: () => {
        clearAuthSession();
        setUser(null);
        setIsAuthenticated(false);
      },
    }),
    [isAuthenticated, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
