import { apiRequest, USE_MOCKS } from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
import { mockDelay } from '@/mocks/handlers';
import type { LoginInput, LoginResult, SignupInput, User } from '@/types/api';

const mockUser: User = {
  userId: 1,
  email: 'owner@example.com',
  nickname: '그린스페이스랩',
  role: 'OWNER',
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
      role: input.role,
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
