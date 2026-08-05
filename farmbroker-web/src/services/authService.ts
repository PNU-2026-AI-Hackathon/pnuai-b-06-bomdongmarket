import { apiRequest, USE_MOCKS } from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
import { mockDelay } from '@/mocks/handlers';
import type { LoginInput, LoginResult, SignupInput, User } from '@/types/api';

// 목 사용자는 공간을 등록해 본 소비자 — 여러 역할을 동시에 가진 상태를 기본값으로 둡니다.
const mockUser: User = {
  userId: 1,
  email: 'owner@example.com',
  nickname: '그린스페이스랩',
  roles: ['OWNER', 'CONSUMER'],
};

export async function login(input: LoginInput): Promise<LoginResult> {
  if (USE_MOCKS) {
    await mockDelay();
    return {
      accessToken: 'mock-access-token',
      user: { ...mockUser, email: input.email },
    };
  }

  const response = await apiRequest<LoginResult>(ENDPOINTS.auth.login, {
    method: 'POST',
    body: input,
  });
  return response.data;
}

export async function signup(input: SignupInput): Promise<User> {
  if (USE_MOCKS) {
    await mockDelay();
    return {
      userId: 2,
      email: input.email,
      nickname: input.nickname,
      roles: ['CONSUMER'],
    };
  }

  const response = await apiRequest<User>(ENDPOINTS.auth.signup, {
    method: 'POST',
    body: input,
  });
  return response.data;
}

export async function getCurrentUser(): Promise<User> {
  if (USE_MOCKS) {
    await mockDelay();
    return mockUser;
  }

  const response = await apiRequest<User>(ENDPOINTS.users.me);
  return response.data;
}
