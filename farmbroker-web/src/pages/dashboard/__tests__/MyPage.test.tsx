import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/api/client';
import { clearAuthSession, getStoredUser, saveAuthSession } from '@/auth/session';
import { MyPage } from '@/pages/dashboard/MyPage';
import { logout } from '@/services/authService';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { UserRole } from '@/types/api';

vi.mock('@/services/authService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/authService')>()),
  logout: vi.fn(),
}));

function signInWithRoles(roles: UserRole[]) {
  saveAuthSession({
    userId: 2,
    email: 'farmer@example.com',
    nickname: '도시농부',
    roles,
  });
}

describe('MyPage 역할 표시', () => {
  beforeEach(() => {
    clearAuthSession();
    vi.mocked(logout).mockReset();
  });

  it('보유한 역할을 모두 표시한다', () => {
    signInWithRoles(['OWNER', 'FARMER', 'CONSUMER']);

    renderWithProviders(<MyPage />);

    expect(screen.getByText('공간 제공자')).toBeInTheDocument();
    expect(screen.getByText('도심 농부')).toBeInTheDocument();
    expect(screen.getByText('소비자')).toBeInTheDocument();
  });

  it('가지지 않은 역할은 표시하지 않는다', () => {
    signInWithRoles(['CONSUMER']);

    renderWithProviders(<MyPage />);

    expect(screen.getByText('소비자')).toBeInTheDocument();
    expect(screen.queryByText('공간 제공자')).not.toBeInTheDocument();
    expect(screen.queryByText('도심 농부')).not.toBeInTheDocument();
  });

  // 이전 구현은 역할이 없으면 '공간 제공자'로 잘못 표시했습니다.
  it('역할이 없으면 아무 뱃지도 표시하지 않는다', () => {
    signInWithRoles([]);

    renderWithProviders(<MyPage />);

    expect(screen.queryByText('공간 제공자')).not.toBeInTheDocument();
    expect(screen.queryByText('소비자')).not.toBeInTheDocument();
  });

  it('로그아웃 API를 호출한 뒤 이 기기의 세션을 끝낸다', async () => {
    const user = userEvent.setup();
    signInWithRoles(['CONSUMER']);
    vi.mocked(logout).mockResolvedValue(undefined);

    renderWithProviders(<MyPage />);

    await user.click(screen.getByRole('button', { name: '로그아웃' }));

    await waitFor(() => expect(logout).toHaveBeenCalledTimes(1));
    expect(getStoredUser()).toBeNull();
  });

  // 쿠키는 서버만 만료시킬 수 있으므로, 서버 로그아웃이 실패하면 로컬 세션을 지우면 안 된다
  // (지우면 새로고침 시 살아있는 쿠키로 다시 로그인됨).
  it('서버 로그아웃이 네트워크 오류로 실패하면 세션을 유지하고 오류를 안내한다', async () => {
    const user = userEvent.setup();
    signInWithRoles(['CONSUMER']);
    vi.mocked(logout).mockRejectedValue(new Error('네트워크 오류'));

    renderWithProviders(<MyPage />);

    await user.click(screen.getByRole('button', { name: '로그아웃' }));

    await waitFor(() => expect(logout).toHaveBeenCalledTimes(1));
    expect(getStoredUser()).not.toBeNull();
    expect(screen.getByRole('alert')).toHaveTextContent('로그아웃에 실패');
  });

  it('로그아웃 요청이 401이면 쿠키가 무효이므로 세션을 정리한다', async () => {
    const user = userEvent.setup();
    signInWithRoles(['CONSUMER']);
    vi.mocked(logout).mockRejectedValue(new ApiError('인증이 필요합니다.', 401, 'UNAUTHORIZED'));

    renderWithProviders(<MyPage />);

    await user.click(screen.getByRole('button', { name: '로그아웃' }));

    await waitFor(() => expect(getStoredUser()).toBeNull());
  });
});
