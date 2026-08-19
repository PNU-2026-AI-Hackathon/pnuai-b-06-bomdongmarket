import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';

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

  // /users/me로 사용자 정보를 다시 받아 온다. 역할처럼 서버에서만 바뀌는 값은
  // 이 호출로만 최신이 되므로 부팅 재검증과 세션 중 갱신이 같은 경로를 쓴다.
  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await getCurrentUser();
      updateStoredUser(currentUser);
      setUser(currentUser);
      setIsAuthenticated(true);
    } catch (error) {
      // 401은 쿠키 없음/만료 = 비로그인 확정 → 세션 정리. 네트워크·일시 장애는 캐시를 유지해
      // 새로고침 직후 헤더가 비로그인으로 깜빡이는 현상을 막는다.
      if (error instanceof ApiError && error.status === 401) {
        clearAuthSession();
        setUser(null);
        setIsAuthenticated(false);
      }
    }
  }, []);

  useEffect(() => {
    // Access Token은 httpOnly 쿠키에 있어 JS로 읽을 수 없으므로, 부팅 시 /users/me를 호출해
    // 로그인 상태를 재검증한다. 캐시된 사용자는 첫 페인트 즉시 표시용이고, 이 요청이 최종 확인이다.
    // 테스트 등에서 initialAuthenticated로 상태를 주입한 경우에는 건너뛴다.
    if (initialAuthenticated !== undefined) return;

    void refreshUser();
  }, [initialAuthenticated, refreshUser]);

  useEffect(() => {
    // 상대가 나중에 계약에 동의하면 이 탭은 역할이 바뀐 사실을 알 수 없다.
    // 탭으로 돌아올 때 사용자 정보를 다시 받아 새로고침 없이 반영한다.
    // 비로그인 상태에서는 구독하지 않아 불필요한 401을 만들지 않는다.
    if (initialAuthenticated !== undefined || !isAuthenticated) return;

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') void refreshUser();
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [initialAuthenticated, isAuthenticated, refreshUser]);

  const value = useMemo(
    () => ({
      isAuthenticated,
      user,
      refreshUser,
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
    [isAuthenticated, refreshUser, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
