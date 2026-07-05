import { APP_INFO } from '../constants/appInfo';
import type { ApiResponse } from '../types/api';

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  token?: string;
};

export const USE_MOCKS = import.meta.env.VITE_USE_MOCKS !== 'false';

export async function apiRequest<T>(
  endpoint: string,
  { body, headers, token, ...options }: RequestOptions = {},
): Promise<ApiResponse<T>> {
  const response = await fetch(`${APP_INFO.baseUrl}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const payload = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !payload.success) {
    throw new Error(payload.message || 'Request failed');
  }

  return payload;
}
