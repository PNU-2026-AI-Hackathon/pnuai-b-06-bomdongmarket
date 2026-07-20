import { APP_INFO } from '@/constants/appInfo';
import { clearAuthSession, getAccessToken } from '@/auth/session';
import type { ApiResponse } from '@/types/api';

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  token?: string;
};

export const USE_MOCKS =
  import.meta.env.MODE === 'test' || import.meta.env.VITE_USE_MOCKS === 'true';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly errorCode?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiRequest<T>(
  endpoint: string,
  { body, headers, token, ...options }: RequestOptions = {},
): Promise<ApiResponse<T>> {
  const requestHeaders = new Headers(headers);
  const accessToken = token ?? getAccessToken();

  if (body !== undefined && !requestHeaders.has('Content-Type')) {
    requestHeaders.set('Content-Type', 'application/json');
  }
  if (accessToken && !requestHeaders.has('Authorization')) {
    requestHeaders.set('Authorization', `Bearer ${accessToken}`);
  }

  const response = await fetch(`${APP_INFO.baseUrl}${endpoint}`, {
    ...options,
    headers: requestHeaders,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  let payload: ApiResponse<T> | null = null;
  try {
    payload = (await response.json()) as ApiResponse<T>;
  } catch {
    // 프록시/서버 장애로 JSON이 아닌 응답이 오더라도 아래에서 일관된 오류로 변환합니다.
  }

  if (!response.ok || !payload?.success) {
    if (response.status === 401 && accessToken) clearAuthSession();
    throw new ApiError(
      payload?.message || '요청 처리에 실패했습니다.',
      response.status,
      payload?.errorCode,
    );
  }

  return payload;
}
