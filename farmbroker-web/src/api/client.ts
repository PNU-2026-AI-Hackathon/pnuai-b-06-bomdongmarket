import { APP_INFO } from '@/constants/appInfo';
import { clearAuthSession } from '@/auth/session';
import type { ApiResponse } from '@/types/api';

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
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
  { body, headers, ...options }: RequestOptions = {},
): Promise<ApiResponse<T>> {
  const requestHeaders = new Headers(headers);

  // FormData는 브라우저가 boundary를 포함한 Content-Type을 직접 만들어야 하므로 건드리지 않습니다.
  const isFormData = body instanceof FormData;

  if (body !== undefined && !isFormData && !requestHeaders.has('Content-Type')) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${APP_INFO.baseUrl}${endpoint}`, {
    ...options,
    // 인증은 httpOnly 쿠키로 이뤄지므로 크로스오리진 요청에도 쿠키를 포함시킨다.
    credentials: 'include',
    headers: requestHeaders,
    body: body === undefined || isFormData ? (body as BodyInit | undefined) : JSON.stringify(body),
  });

  let payload: ApiResponse<T> | null = null;
  try {
    payload = (await response.json()) as ApiResponse<T>;
  } catch {
    // 프록시/서버 장애로 JSON이 아닌 응답이 오더라도 아래에서 일관된 오류로 변환합니다.
  }

  if (!response.ok || !payload?.success) {
    // 인증 만료/누락(401)은 캐시된 세션을 정리해 UI를 비로그인 상태로 되돌린다.
    if (response.status === 401) clearAuthSession();
    throw new ApiError(
      payload?.message || '요청 처리에 실패했습니다.',
      response.status,
      payload?.errorCode,
    );
  }

  return payload;
}
