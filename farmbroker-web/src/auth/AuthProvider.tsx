import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';

import { ApiError } from '@/api/client';
import { AuthContext } from '@/auth/authContext';
import {
  AUTH_SESSION_CHANGED_EVENT,
  clearAuthSession,
  clearStoredUser,
  getStoredUser,
  saveAuthSession,
  updateStoredUser,
} from '@/auth/session';
import {
  getCurrentUser,
  login as requestLogin,
  logout as requestLogout,
} from '@/services/authService';
import {
  updateCurrentUser as requestUpdateCurrentUser,
  withdrawCurrentUser as requestWithdrawCurrentUser,
} from '@/services/userService';
import type {
  LoginInput,
  User,
  UserUpdateInput,
  UserWithdrawalInput,
} from '@/types/api';

interface AuthProviderProps {
  children: ReactNode;
  initialAuthenticated?: boolean;
}

export function AuthProvider({ children, initialAuthenticated }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(() => getStoredUser());
  const [isAuthenticated, setIsAuthenticated] = useState(() =>
    initialAuthenticated === undefined ? Boolean(getStoredUser()) : initialAuthenticated,
  );

  useEffect(() => {
    function syncSession() {
      const stored = getStoredUser();
      setUser(stored);
      setIsAuthenticated(Boolean(stored));
    }

    window.addEventListener(AUTH_SESSION_CHANGED_EVENT, syncSession);
    return () => window.removeEventListener(AUTH_SESSION_CHANGED_EVENT, syncSession);
  }, []);

  useEffect(() => {
    // Access Token은 httpOnly 쿠키에 있어 JS로 읽을 수 없으므로, 부팅 시 /users/me를 호출해
    // 로그인 상태를 재검증한다. 캐시된 사용자는 첫 페인트 즉시 표시용이고, 이 요청이 최종 확인이다.
    // 테스트 등에서 initialAuthenticated로 상태를 주입한 경우에는 건너뛴다.
    if (initialAuthenticated !== undefined) return;

    let cancelled = false;
    void getCurrentUser()
      .then((currentUser) => {
        if (cancelled) return;
        updateStoredUser(currentUser);
        setUser(currentUser);
        setIsAuthenticated(true);
      })
      .catch((error) => {
        if (cancelled) return;
        // 401은 쿠키 없음/만료 = 비로그인 확정 → 세션 정리. 네트워크·일시 장애는 캐시를 유지해
        // 새로고침 직후 헤더가 비로그인으로 깜빡이는 현상을 막는다.
        if (error instanceof ApiError && error.status === 401) {
          clearAuthSession();
          setUser(null);
          setIsAuthenticated(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [initialAuthenticated]);

  const value = useMemo(
    () => ({
      isAuthenticated,
      user,
      login: async (input: LoginInput) => {
        const result = await requestLogin(input);
        saveAuthSession(result.user);
        setUser(result.user);
        setIsAuthenticated(true);
        return result.user;
      },
      logout: async () => {
        // httpOnly 쿠키는 서버만 만료시킬 수 있다(JS로 삭제 불가). 따라서 로컬 세션은
        // 쿠키가 확실히 사라졌을 때 — 로그아웃 성공 또는 401(쿠키 무효) — 에만 정리한다.
        try {
          await requestLogout();
        } catch (error) {
          // 401은 apiRequest가 이미 세션을 정리했고 쿠키도 무효라 로그아웃이 성립한다.
          // 네트워크·5xx로 실패한 경우엔 쿠키가 그대로 살아 있어 실제로는 로그아웃되지 않았으므로
          // (로컬만 지우면 새로고침 시 /users/me로 다시 로그인됨) 세션을 지우지 않고 오류를 전파한다.
          if (!(error instanceof ApiError && error.status === 401)) {
            throw error;
          }
        }
        clearStoredUser();
        setUser(null);
        setIsAuthenticated(false);
      },
      updateUser: async (input: UserUpdateInput) => {
        const updatedUser = await requestUpdateCurrentUser(input);
        updateStoredUser(updatedUser);
        setUser(updatedUser);
        return updatedUser;
      },
      withdraw: async (input: UserWithdrawalInput) => {
        await requestWithdrawCurrentUser(input);
      },
    }),
    [isAuthenticated, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
