import { beforeEach, describe, expect, it } from 'vitest';

import { clearAuthSession, saveAuthSession } from '@/auth/session';
import {
  getWithdrawalEligibility,
  updateCurrentUser,
  withdrawCurrentUser,
} from '@/services/userService';

describe('userService 목 계약', () => {
  beforeEach(() => {
    clearAuthSession();
    saveAuthSession({
      userId: 2,
      email: 'farmer@example.com',
      nickname: '도시농부',
      roles: ['FARMER', 'CONSUMER'],
    });
  });

  it('실제 DTO와 같은 계정 수정 결과를 반환한다', async () => {
    await expect(updateCurrentUser({ nickname: '새도시농부' })).resolves.toEqual({
      userId: 2,
      email: 'farmer@example.com',
      nickname: '새도시농부',
      roles: ['FARMER', 'CONSUMER'],
    });
  });

  it('잘못된 현재 비밀번호를 실제 API와 같은 오류 코드로 거부한다', async () => {
    const request = updateCurrentUser({
      nickname: '도시농부',
      currentPassword: 'wrong-password',
      newPassword: 'newpassword',
    });

    await expect(request).rejects.toMatchObject({
      status: 400,
      errorCode: 'INVALID_CURRENT_PASSWORD',
    });
  });

  it('기본 eligibility와 성공 탈퇴 계약을 같은 타입으로 제공한다', async () => {
    await expect(getWithdrawalEligibility()).resolves.toEqual({
      withdrawable: true,
      activeContractCount: 0,
      reason: null,
    });
    await expect(
      withdrawCurrentUser({ currentPassword: 'password123', agreement: true }),
    ).resolves.toBeUndefined();
  });
});
