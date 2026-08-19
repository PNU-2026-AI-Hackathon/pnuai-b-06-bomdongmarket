import { screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/api/client';
import { useAuth } from '@/auth/authContext';
import { clearAuthSession, saveAuthSession } from '@/auth/session';
import { Header } from '@/components/layout/Header';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { User } from '@/types/api';

const authServiceMocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  login: vi.fn(),
}));

vi.mock('@/services/authService', () => ({
  getCurrentUser: authServiceMocks.getCurrentUser,
  login: authServiceMocks.login,
}));

const farmer: User = {
  userId: 2,
  email: 'farmer@example.com',
  nickname: '도시농부',
  roles: ['FARMER'],
};

// 매칭이 확정되기 전의 같은 사람 — 역할만 다릅니다.
const consumer: User = { ...farmer, roles: ['CONSUMER'] };

// 역할은 헤더에 드러나지 않으므로 context 값을 그대로 그려 확인합니다.
function RoleProbe() {
  const { user } = useAuth();
  return <p>{user?.roles.join(',')}</p>;
}

describe('AuthProvider 세션 복원', () => {
  beforeEach(() => {
    clearAuthSession();
    authServiceMocks.getCurrentUser.mockReset();
    authServiceMocks.login.mockReset();
  });

  it('부팅 시 /users/me(쿠키 인증)로 세션을 재검증해 로그인 상태를 복원한다', async () => {
    // Access Token은 httpOnly 쿠키라 JS로 읽을 수 없으므로, 캐시된 사용자가 있어도 서버로 재검증한다.
    saveAuthSession(farmer);
    authServiceMocks.getCurrentUser.mockResolvedValue(farmer);

    renderWithProviders(<Header />);

    await waitFor(() => expect(authServiceMocks.getCurrentUser).toHaveBeenCalled());
    expect(screen.getByRole('link', { name: '도시농부 마이페이지' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '로그인' })).not.toBeInTheDocument();
  });

  it('재검증이 401이면 캐시된 세션을 비우고 비로그인 상태가 된다', async () => {
    saveAuthSession(farmer);
    authServiceMocks.getCurrentUser.mockRejectedValue(
      new ApiError('인증이 필요합니다.', 401, 'UNAUTHORIZED'),
    );

    renderWithProviders(<Header />);

    await waitFor(() =>
      expect(screen.getByRole('link', { name: '로그인' })).toBeInTheDocument(),
    );
    expect(
      screen.queryByRole('link', { name: '도시농부 마이페이지' }),
    ).not.toBeInTheDocument();
  });

  it('탭으로 돌아오면 /users/me를 다시 불러 서버에서 부여된 역할을 반영한다', async () => {
    // 상대가 나중에 계약에 동의하면 이 탭은 역할이 바뀐 사실을 알 수 없어, 복귀 시 재검증한다.
    saveAuthSession(consumer);
    authServiceMocks.getCurrentUser
      .mockResolvedValueOnce(consumer)
      .mockResolvedValueOnce(farmer);

    renderWithProviders(<RoleProbe />);

    expect(await screen.findByText('CONSUMER')).toBeInTheDocument();

    document.dispatchEvent(new Event('visibilitychange'));

    expect(await screen.findByText('FARMER')).toBeInTheDocument();
  });
});
