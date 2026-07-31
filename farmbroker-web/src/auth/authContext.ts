import { createContext, useContext } from 'react';
import type { LoginInput, User } from '@/types/api';

export interface AuthContextValue {
  isAuthenticated: boolean;
  user: User | null;
  login: (input: LoginInput) => Promise<User>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth는 AuthProvider 안에서 사용해야 합니다.');
  }

  return context;
}
