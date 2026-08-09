import { ApiError, apiRequest, USE_MOCKS } from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
import { getStoredUser } from '@/auth/session';
import { mockDelay } from '@/mocks/handlers';
import {
  MOCK_CURRENT_PASSWORD,
  mockWithdrawalEligibility,
} from '@/mocks/mockMyPage';
import type {
  User,
  UserUpdateInput,
  UserWithdrawalInput,
  WithdrawalEligibility,
} from '@/types/api';

function getMockUser(): User {
  const user = getStoredUser();
  if (!user) {
    throw new ApiError('인증이 필요합니다.', 401, 'UNAUTHORIZED');
  }
  return user;
}

export async function updateCurrentUser(input: UserUpdateInput): Promise<User> {
  if (USE_MOCKS) {
    await mockDelay();
    const user = getMockUser();
    if (input.newPassword && input.currentPassword !== MOCK_CURRENT_PASSWORD) {
      throw new ApiError(
        '현재 비밀번호가 일치하지 않습니다.',
        400,
        'INVALID_CURRENT_PASSWORD',
      );
    }
    return { ...user, nickname: input.nickname.trim() };
  }

  const response = await apiRequest<User>(ENDPOINTS.users.me, {
    method: 'PATCH',
    body: input,
  });
  return response.data;
}

export async function getWithdrawalEligibility(): Promise<WithdrawalEligibility> {
  if (USE_MOCKS) {
    await mockDelay();
    getMockUser();
    return { ...mockWithdrawalEligibility };
  }

  const response = await apiRequest<WithdrawalEligibility>(
    ENDPOINTS.users.withdrawalEligibility,
  );
  return response.data;
}

export async function withdrawCurrentUser(input: UserWithdrawalInput): Promise<void> {
  if (USE_MOCKS) {
    await mockDelay();
    getMockUser();
    if (input.currentPassword !== MOCK_CURRENT_PASSWORD) {
      throw new ApiError(
        '현재 비밀번호가 일치하지 않습니다.',
        400,
        'INVALID_CURRENT_PASSWORD',
      );
    }
    return;
  }

  await apiRequest<void>(ENDPOINTS.users.me, {
    method: 'DELETE',
    body: input,
  });
}
