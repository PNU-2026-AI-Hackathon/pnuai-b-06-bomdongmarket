import { createContext, useContext } from 'react';
import type {
  LoginInput,
  User,
  UserUpdateInput,
  UserWithdrawalInput,
} from '@/types/api';

export interface AuthContextValue {
  isAuthenticated: boolean;
  user: User | null;
  // 서버에서만 바뀌는 값(역할 등)을 다시 받아 오기 위한 재조회입니다.
  refreshUser: () => Promise<void>;
  login: (input: LoginInput) => Promise<User>;
  logout: () => Promise<void>;
  updateUser: (input: UserUpdateInput) => Promise<User>;
  withdraw: (input: UserWithdrawalInput) => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth는 AuthProvider 안에서 사용해야 합니다.');
  }

  return context;
}
