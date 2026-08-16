import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ApiResponse, User, WithdrawalEligibility } from '@/types/api';

const apiRequestMock = vi.hoisted(() => vi.fn());

vi.mock('@/api/client', () => ({
  ApiError: class ApiError extends Error {},
  USE_MOCKS: false,
  apiRequest: apiRequestMock,
}));

import {
  getWithdrawalEligibility,
  updateCurrentUser,
  withdrawCurrentUser,
} from '@/services/userService';

const user: User = {
  userId: 2,
  email: 'farmer@example.com',
  nickname: '새도시농부',
  roles: ['FARMER'],
};

describe('userService 실제 API 분기', () => {
  beforeEach(() => apiRequestMock.mockReset());

  it('계정 수정 요청을 PATCH /users/me로 보낸다', async () => {
    apiRequestMock.mockResolvedValue({
      success: true,
      message: '수정 완료',
      data: user,
    } satisfies ApiResponse<User>);

    await expect(
      updateCurrentUser({
        nickname: '새도시농부',
        currentPassword: 'password123',
        newPassword: 'newpassword',
      }),
    ).resolves.toEqual(user);
    expect(apiRequestMock).toHaveBeenCalledWith('/users/me', {
      method: 'PATCH',
      body: {
        nickname: '새도시농부',
        currentPassword: 'password123',
        newPassword: 'newpassword',
      },
    });
  });

  it('탈퇴 가능 여부를 전용 GET 경로에서 조회한다', async () => {
    const eligibility: WithdrawalEligibility = {
      withdrawable: false,
      activeContractCount: 1,
      reason: 'ACTIVE_CONTRACT_EXISTS',
    };
    apiRequestMock.mockResolvedValue({
      success: true,
      message: '조회 완료',
      data: eligibility,
    } satisfies ApiResponse<WithdrawalEligibility>);

    await expect(getWithdrawalEligibility()).resolves.toEqual(eligibility);
    expect(apiRequestMock).toHaveBeenCalledWith('/users/me/withdrawal-eligibility');
  });

  it('회원 탈퇴 요청을 본인 확인 값과 함께 DELETE /users/me로 보낸다', async () => {
    apiRequestMock.mockResolvedValue({ success: true, message: '탈퇴 완료' });

    await expect(
      withdrawCurrentUser({ currentPassword: 'password123', agreement: true }),
    ).resolves.toBeUndefined();
    expect(apiRequestMock).toHaveBeenCalledWith('/users/me', {
      method: 'DELETE',
      body: { currentPassword: 'password123', agreement: true },
    });
  });
});
