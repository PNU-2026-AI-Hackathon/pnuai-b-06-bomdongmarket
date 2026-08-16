import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/api/client';
import { clearAuthSession, getStoredUser, saveAuthSession } from '@/auth/session';
import { Header } from '@/components/layout/Header';
import { ProfileEditPage } from '@/pages/mypage/ProfileEditPage';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { User } from '@/types/api';

const userServiceMocks = vi.hoisted(() => ({
  getWithdrawalEligibility: vi.fn(),
  updateCurrentUser: vi.fn(),
  withdrawCurrentUser: vi.fn(),
}));

vi.mock('@/services/userService', () => userServiceMocks);

const currentUser: User = {
  userId: 2,
  email: 'farmer@example.com',
  nickname: '도시농부',
  roles: ['FARMER', 'CONSUMER'],
};

describe('ProfileEditPage', () => {
  beforeEach(() => {
    clearAuthSession();
    saveAuthSession(currentUser);
    userServiceMocks.updateCurrentUser.mockReset();
  });

  it('이메일을 읽기 전용으로 표시하고 비밀번호 변경을 선택 사항으로 안내한다', () => {
    renderWithProviders(<ProfileEditPage />);

    expect(screen.getByLabelText('이메일')).toHaveAttribute('readonly');
    expect(screen.getByLabelText('이메일')).toHaveValue('farmer@example.com');
    expect(screen.getByLabelText('닉네임')).toHaveValue('도시농부');
    expect(screen.getByText(/세 필드를 모두 비워 두세요/)).toBeInTheDocument();
  });

  it('닉네임 저장 후 전역 사용자와 세션 캐시를 즉시 갱신한다', async () => {
    const user = userEvent.setup();
    const updatedUser = { ...currentUser, nickname: '새도시농부' };
    userServiceMocks.updateCurrentUser.mockResolvedValue(updatedUser);

    renderWithProviders(
      <>
        <Header />
        <ProfileEditPage />
      </>,
    );

    await user.clear(screen.getByLabelText('닉네임'));
    await user.type(screen.getByLabelText('닉네임'), '새도시농부');
    await user.click(screen.getByRole('button', { name: '계정 정보 저장' }));

    await waitFor(() =>
      expect(userServiceMocks.updateCurrentUser).toHaveBeenCalledWith({
        nickname: '새도시농부',
      }),
    );
    expect(await screen.findByRole('status')).toHaveTextContent('저장되었습니다');
    expect(screen.getByRole('link', { name: '새도시농부 마이페이지' })).toBeInTheDocument();
    expect(getStoredUser()?.nickname).toBe('새도시농부');
  });

  it('닉네임 입력란에서 Enter를 눌러 저장할 수 있다', async () => {
    const user = userEvent.setup();
    const updatedUser = { ...currentUser, nickname: '키보드농부' };
    userServiceMocks.updateCurrentUser.mockResolvedValue(updatedUser);
    renderWithProviders(<ProfileEditPage />);

    const nicknameInput = screen.getByLabelText('닉네임');
    await user.clear(nicknameInput);
    await user.type(nicknameInput, '키보드농부{Enter}');

    await waitFor(() =>
      expect(userServiceMocks.updateCurrentUser).toHaveBeenCalledWith({
        nickname: '키보드농부',
      }),
    );
  });

  it('새 비밀번호 확인이 다르면 API를 호출하지 않는다', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ProfileEditPage />);

    await user.type(screen.getByLabelText('현재 비밀번호'), 'password123');
    await user.type(screen.getByLabelText('새 비밀번호', { exact: true }), 'newpassword');
    await user.type(screen.getByLabelText('새 비밀번호 확인'), 'different1');
    await user.click(screen.getByRole('button', { name: '계정 정보 저장' }));

    expect(screen.getByRole('alert')).toHaveTextContent('새 비밀번호가 일치하지 않습니다');
    expect(userServiceMocks.updateCurrentUser).not.toHaveBeenCalled();
  });

  it('현재 비밀번호 오류를 해당 필드에 연결해 안내한다', async () => {
    const user = userEvent.setup();
    userServiceMocks.updateCurrentUser.mockRejectedValue(
      new ApiError(
        '현재 비밀번호가 일치하지 않습니다.',
        400,
        'INVALID_CURRENT_PASSWORD',
      ),
    );
    renderWithProviders(<ProfileEditPage />);

    await user.type(screen.getByLabelText('현재 비밀번호'), 'wrong-password');
    await user.type(screen.getByLabelText('새 비밀번호', { exact: true }), 'newpassword');
    await user.type(screen.getByLabelText('새 비밀번호 확인'), 'newpassword');
    await user.click(screen.getByRole('button', { name: '계정 정보 저장' }));

    expect(await screen.findByText('현재 비밀번호가 일치하지 않습니다.')).toBeInTheDocument();
    expect(screen.getByLabelText('현재 비밀번호')).toHaveAttribute('aria-invalid', 'true');
  });

  it('저장 중 버튼을 비활성화해 중복 요청을 막는다', async () => {
    const user = userEvent.setup();
    let resolveUpdate: ((value: User) => void) | undefined;
    userServiceMocks.updateCurrentUser.mockReturnValue(
      new Promise<User>((resolve) => {
        resolveUpdate = resolve;
      }),
    );
    renderWithProviders(<ProfileEditPage />);

    await user.click(screen.getByRole('button', { name: '계정 정보 저장' }));

    expect(screen.getByRole('button', { name: '저장 중...' })).toBeDisabled();
    expect(userServiceMocks.updateCurrentUser).toHaveBeenCalledTimes(1);

    await act(async () => resolveUpdate?.(currentUser));
    await screen.findByRole('status');
  });
});
