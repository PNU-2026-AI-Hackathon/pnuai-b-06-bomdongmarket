import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/api/client';
import { clearAuthSession, getStoredUser, saveAuthSession } from '@/auth/session';
import { MyPage } from '@/pages/mypage/MyPage';
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

describe('MyPage 계정 설정', () => {
  beforeEach(() => {
    clearAuthSession();
    vi.mocked(logout).mockReset();
  });

  it('이메일과 닉네임, 보유 역할을 모두 표시한다', () => {
    signInWithRoles(['OWNER', 'FARMER', 'CONSUMER']);

    renderWithProviders(<MyPage />);

    expect(screen.getByRole('heading', { level: 1, name: '마이페이지' })).toBeInTheDocument();
    expect(screen.getByText('farmer@example.com')).toBeInTheDocument();
    expect(screen.getByText('도시농부')).toBeInTheDocument();
    expect(screen.getByText('공간 제공자')).toBeInTheDocument();
    expect(screen.getByText('도심 농부')).toBeInTheDocument();
    expect(screen.getByText('소비자')).toBeInTheDocument();
  });

  it('가지지 않은 역할이나 임의의 기본 역할을 표시하지 않는다', () => {
    signInWithRoles([]);

    renderWithProviders(<MyPage />);

    expect(screen.queryByText('공간 제공자')).not.toBeInTheDocument();
    expect(screen.queryByText('도심 농부')).not.toBeInTheDocument();
    expect(screen.queryByText('소비자')).not.toBeInTheDocument();
  });

  it('소비자에게 찜과 계정 설정 링크를 제공한다', () => {
    signInWithRoles(['CONSUMER']);

    renderWithProviders(<MyPage />);

    expect(screen.getByRole('link', { name: /찜/ })).toHaveAttribute(
      'href',
      '/market/wishlist',
    );
    expect(screen.getByRole('link', { name: /계정 정보 수정/ })).toHaveAttribute(
      'href',
      '/mypage/profile',
    );
    expect(screen.getByRole('link', { name: /회원 탈퇴/ })).toHaveAttribute(
      'href',
      '/mypage/withdraw',
    );
    expect(screen.queryByRole('link', { name: /판매 상품 관리/ })).not.toBeInTheDocument();
    ['내 공간', '내 구매 내역', '정산 요약', '계약 내역', '고객센터'].forEach(
      (label) => expect(screen.queryByText(label)).not.toBeInTheDocument(),
    );
    expect(screen.queryByText('120만원')).not.toBeInTheDocument();
  });

  it('농부에게 판매 상품 관리 진입점을 제공한다', () => {
    signInWithRoles(['FARMER', 'CONSUMER']);

    renderWithProviders(<MyPage />);

    expect(screen.getByRole('link', { name: /판매 상품 관리/ })).toHaveAttribute(
      'href',
      '/market/my',
    );
  });

  it('키보드만으로 서비스 이용과 계정 설정을 순서대로 탐색할 수 있다', async () => {
    const user = userEvent.setup();
    signInWithRoles(['CONSUMER']);

    renderWithProviders(<MyPage />);

    await user.tab();
    expect(screen.getByRole('link', { name: /찜/ })).toHaveFocus();

    await user.tab();
    expect(screen.getByRole('link', { name: /계정 정보 수정/ })).toHaveFocus();

    await user.tab();
    expect(screen.getByRole('link', { name: /회원 탈퇴/ })).toHaveFocus();

    await user.tab();
    expect(screen.getByRole('button', { name: '로그아웃' })).toHaveFocus();
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

  it('서버 로그아웃이 네트워크 오류로 실패하면 세션을 유지하고 오류를 안내한다', async () => {
    const user = userEvent.setup();
    signInWithRoles(['CONSUMER']);
    vi.mocked(logout).mockRejectedValue(new Error('네트워크 오류'));

    renderWithProviders(<MyPage />);

    await user.click(screen.getByRole('button', { name: '로그아웃' }));

    await waitFor(() => expect(logout).toHaveBeenCalledTimes(1));
    expect(getStoredUser()).not.toBeNull();
    expect(screen.getByRole('alert')).toHaveTextContent('로그아웃하지 못했습니다');
  });

  it('로그아웃 요청이 401이면 쿠키가 무효이므로 세션을 정리한다', async () => {
    const user = userEvent.setup();
    signInWithRoles(['CONSUMER']);
    vi.mocked(logout).mockRejectedValue(
      new ApiError('인증이 필요합니다.', 401, 'UNAUTHORIZED'),
    );

    renderWithProviders(<MyPage />);

    await user.click(screen.getByRole('button', { name: '로그아웃' }));

    await waitFor(() => expect(getStoredUser()).toBeNull());
  });
});
