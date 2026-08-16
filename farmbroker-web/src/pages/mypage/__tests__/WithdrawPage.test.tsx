import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/api/client';
import { AppRouter } from '@/app/router';
import { clearAuthSession, getStoredUser, saveAuthSession } from '@/auth/session';
import { WithdrawPage } from '@/pages/mypage/WithdrawPage';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { User, WithdrawalEligibility } from '@/types/api';

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
  roles: ['FARMER'],
};

const withdrawable: WithdrawalEligibility = {
  withdrawable: true,
  activeContractCount: 0,
  reason: null,
};

function signIn() {
  saveAuthSession(currentUser);
}

async function completeWithdrawalForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('현재 비밀번호'), 'password123');
  await user.click(screen.getByRole('checkbox', { name: /탈퇴 후 계정을 복구/ }));
  await user.click(screen.getByRole('button', { name: '회원 탈퇴하기' }));
}

describe('WithdrawPage', () => {
  beforeEach(() => {
    clearAuthSession();
    signIn();
    userServiceMocks.getWithdrawalEligibility.mockReset();
    userServiceMocks.updateCurrentUser.mockReset();
    userServiceMocks.withdrawCurrentUser.mockReset();
  });

  it('탈퇴 가능 여부를 불러오는 동안 구체적인 진행 상태를 표시한다', () => {
    userServiceMocks.getWithdrawalEligibility.mockReturnValue(new Promise(() => undefined));

    renderWithProviders(<WithdrawPage />);

    expect(screen.getByRole('status')).toHaveTextContent('탈퇴 가능 여부를 확인하는 중');
    expect(screen.getByText('대기 중인 매칭 신청, 등록 공간, 찜는 정리됩니다.')).toBeInTheDocument();
    expect(screen.getByText('판매 중인 상품은 마켓에서 비공개 처리됩니다.')).toBeInTheDocument();
    expect(screen.getByText(/구매 이력은 정산을 위해 비식별화된 계정/)).toBeInTheDocument();
  });

  it('진행 중인 계약이 있으면 탈퇴 폼 대신 계약 이동 링크를 제공한다', async () => {
    userServiceMocks.getWithdrawalEligibility.mockResolvedValue({
      withdrawable: false,
      activeContractCount: 2,
      reason: 'ACTIVE_CONTRACT_EXISTS',
    });

    renderWithProviders(<WithdrawPage />);

    expect(
      await screen.findByRole('heading', { name: '진행 중인 계약이 있어 탈퇴할 수 없습니다' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/2건/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '진행 중인 계약 확인' })).toHaveAttribute(
      'href',
      '/dashboard#contracted-spaces',
    );
    expect(screen.queryByRole('button', { name: '회원 탈퇴하기' })).not.toBeInTheDocument();
  });

  it('가능 여부 조회 오류를 안내하고 다시 시도할 수 있다', async () => {
    const user = userEvent.setup();
    userServiceMocks.getWithdrawalEligibility
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce(withdrawable);

    renderWithProviders(<WithdrawPage />);

    await screen.findByRole('heading', { name: '탈퇴 가능 여부를 확인하지 못했습니다' });
    await user.click(screen.getByRole('button', { name: '다시 시도' }));

    expect(await screen.findByRole('heading', { name: '본인 확인' })).toBeInTheDocument();
    expect(userServiceMocks.getWithdrawalEligibility).toHaveBeenCalledTimes(2);
  });

  it('탈퇴 요청 중 버튼을 비활성화해 중복 요청을 막는다', async () => {
    const user = userEvent.setup();
    let rejectWithdrawal: ((reason: Error) => void) | undefined;
    userServiceMocks.getWithdrawalEligibility.mockResolvedValue(withdrawable);
    userServiceMocks.withdrawCurrentUser.mockReturnValue(
      new Promise<void>((_resolve, reject) => {
        rejectWithdrawal = reject;
      }),
    );
    renderWithProviders(<WithdrawPage />);
    await screen.findByRole('heading', { name: '본인 확인' });

    await completeWithdrawalForm(user);

    expect(screen.getByRole('button', { name: '회원 탈퇴 중...' })).toBeDisabled();
    expect(userServiceMocks.withdrawCurrentUser).toHaveBeenCalledTimes(1);

    await act(async () => rejectWithdrawal?.(new Error('network')));
    await screen.findByText(/회원 탈퇴를 완료하지 못했습니다/);
  });

  it('키보드만으로 본인 확인과 동의를 완료해 탈퇴를 제출할 수 있다', async () => {
    const user = userEvent.setup();
    userServiceMocks.getWithdrawalEligibility.mockResolvedValue(withdrawable);
    userServiceMocks.withdrawCurrentUser.mockResolvedValue(undefined);
    renderWithProviders(<WithdrawPage />);
    await screen.findByRole('heading', { name: '본인 확인' });

    await user.tab();
    expect(screen.getByRole('link', { name: '마이페이지로' })).toHaveFocus();
    await user.tab();
    expect(screen.getByLabelText('현재 비밀번호')).toHaveFocus();
    await user.keyboard('password123');
    await user.tab();
    expect(screen.getByRole('checkbox', { name: /탈퇴 후 계정을 복구/ })).toHaveFocus();
    await user.keyboard(' ');
    await user.tab();
    expect(screen.getByRole('link', { name: '취소' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: '회원 탈퇴하기' })).toHaveFocus();
    await user.keyboard('{Enter}');

    await waitFor(() =>
      expect(userServiceMocks.withdrawCurrentUser).toHaveBeenCalledWith({
        currentPassword: 'password123',
        agreement: true,
      }),
    );
  });

  it('현재 비밀번호 오류를 필드 가까이에 표시한다', async () => {
    const user = userEvent.setup();
    userServiceMocks.getWithdrawalEligibility.mockResolvedValue(withdrawable);
    userServiceMocks.withdrawCurrentUser.mockRejectedValue(
      new ApiError(
        '현재 비밀번호가 일치하지 않습니다.',
        400,
        'INVALID_CURRENT_PASSWORD',
      ),
    );
    renderWithProviders(<WithdrawPage />);
    await screen.findByRole('heading', { name: '본인 확인' });

    await completeWithdrawalForm(user);

    expect(await screen.findByText('현재 비밀번호가 일치하지 않습니다.')).toBeInTheDocument();
    expect(screen.getByLabelText('현재 비밀번호')).toHaveAttribute('aria-invalid', 'true');
    expect(getStoredUser()).not.toBeNull();
  });

  it('최종 탈퇴 요청에서 계약이 생기면 차단 상태로 전환한다', async () => {
    const user = userEvent.setup();
    userServiceMocks.getWithdrawalEligibility.mockResolvedValue(withdrawable);
    userServiceMocks.withdrawCurrentUser.mockRejectedValue(
      new ApiError('진행 중인 계약이 있습니다.', 409, 'ACTIVE_CONTRACT_EXISTS'),
    );
    renderWithProviders(<WithdrawPage />);
    await screen.findByRole('heading', { name: '본인 확인' });

    await completeWithdrawalForm(user);

    expect(
      await screen.findByText(/최종 확인 중 계약 상태가 변경되었습니다/),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '진행 중인 계약 확인' })).toBeInTheDocument();
    expect(getStoredUser()).not.toBeNull();
  });

  it('탈퇴 성공 시 세션을 지우고 홈에서 완료 사실을 안내한다', async () => {
    const user = userEvent.setup();
    userServiceMocks.getWithdrawalEligibility.mockResolvedValue(withdrawable);
    userServiceMocks.withdrawCurrentUser.mockResolvedValue(undefined);
    renderWithProviders(<AppRouter />, {
      authenticated: true,
      route: '/mypage/withdraw',
    });
    await screen.findByRole('heading', { name: '본인 확인' });

    await completeWithdrawalForm(user);

    await waitFor(() => expect(getStoredUser()).toBeNull());
    expect(
      await screen.findByText('회원 탈퇴가 완료되었습니다. 이용해 주셔서 감사합니다.'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: '비어 있는 공간이 동네의 가장 가까운 농장이 됩니다.',
      }),
    ).toBeInTheDocument();
  });
});
