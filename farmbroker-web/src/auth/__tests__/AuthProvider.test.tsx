import { screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { clearAuthSession, getAccessToken, saveAuthSession } from '@/auth/session';
import { Header } from '@/components/layout/Header';
import { renderWithProviders } from '@/test/renderWithProviders';

const authServiceMocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  login: vi.fn(),
}));

vi.mock('@/services/authService', () => ({
  getCurrentUser: authServiceMocks.getCurrentUser,
  login: authServiceMocks.login,
}));

describe('AuthProvider 세션 복원', () => {
  beforeEach(() => {
    clearAuthSession();
    authServiceMocks.getCurrentUser.mockReset();
    authServiceMocks.login.mockReset();
  });

  it('저장된 사용자가 있으면 불필요한 내 정보 조회 없이 로그인 상태를 복원한다', async () => {
    saveAuthSession({
      accessToken: 'stored-access-token',
      user: {
        userId: 2,
        email: 'farmer@example.com',
        nickname: '도시농부',
        role: 'FARMER',
      },
    });

    renderWithProviders(<Header />);

    await waitFor(() => expect(authServiceMocks.getCurrentUser).not.toHaveBeenCalled());
    expect(getAccessToken()).toBe('stored-access-token');
    expect(screen.getByRole('link', { name: '도시농부 마이페이지' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '로그인' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /공간 등록|등록/ })).not.toBeInTheDocument();
  });
});
