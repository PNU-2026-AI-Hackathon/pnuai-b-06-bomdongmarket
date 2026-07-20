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
    if (!getAccessToken()) return;

    void getCurrentUser()
      .then((currentUser) => {
        updateStoredUser(currentUser);
        setUser(currentUser);
      })
      .catch(() => {
        clearAuthSession();
      });
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
