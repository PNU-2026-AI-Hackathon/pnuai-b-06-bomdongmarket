import { apiRequest, USE_MOCKS } from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
import { mockDelay } from '@/mocks/handlers';
import { mockMatchingRequests } from '@/mocks/mockDashboard';
import type {
  MatchingApplyInput,
  MatchingApplyResult,
  MatchingRequest,
  MatchingStatusResult,
  MyMatching,
} from '@/types/api';

export async function applyMatching(
  input: MatchingApplyInput,
): Promise<MatchingApplyResult> {
  if (!USE_MOCKS) {
    const response = await apiRequest<MatchingApplyResult>(ENDPOINTS.matchings.create, {
      method: 'POST',
      body: input,
    });
    return response.data;
  }

  await mockDelay();
  return {
    ...input,
    matchingId: 99,
    farmerId: 2,
    ownerId: 1,
    status: 'REQUESTED',
    createdAt: new Date().toISOString(),
  };
}

export async function getMyMatchings(spaceId?: number): Promise<MyMatching[]> {
  if (!USE_MOCKS) {
    const response = await apiRequest<MyMatching[]>(
      ENDPOINTS.matchings.myRequests(spaceId),
    );
    return response.data;
  }

  await mockDelay();
  return mockMatchingRequests
    .filter((request) => spaceId === undefined || request.spaceId === spaceId)
    .map((request) => ({
      matchingId: request.matchingId,
      spaceId: request.spaceId,
      spaceTitle: request.spaceTitle,
      spaceImageUrl: request.spaceImageUrl ?? null,
      monthlyRent: request.monthlyRent ?? 0,
      ownerNickname: request.ownerNickname ?? '공간 제공자',
      type: request.type,
      message: request.message,
      status: request.status,
      createdAt: request.createdAt,
      respondedAt: request.respondedAt,
    }));
}

export async function getReceivedMatchings(): Promise<MatchingRequest[]> {
  if (!USE_MOCKS) {
    const response = await apiRequest<MatchingRequest[]>(ENDPOINTS.matchings.received);
    return response.data;
  }

  await mockDelay();
  return mockMatchingRequests;
}

export async function getSentMatchingNotifications(): Promise<MyMatching[]> {
  if (!USE_MOCKS) {
    const response = await apiRequest<MyMatching[]>(ENDPOINTS.matchings.sent);
    return response.data;
  }

  return getMyMatchings();
}

// 신청자 본인이 아직 계약이 확정·취소되지 않은 신청을 거둬들입니다. 취소 후 같은 공간에 재신청할 수 있습니다.
export async function cancelMatching(matchingId: number): Promise<MatchingStatusResult> {
  if (!USE_MOCKS) {
    const response = await apiRequest<MatchingStatusResult>(
      ENDPOINTS.matchings.cancel(matchingId),
      { method: 'PATCH' },
    );
    return response.data;
  }

  await mockDelay();
  return {
    matchingId,
    status: 'CANCELED',
    respondedAt: new Date().toISOString(),
  };
}

// 신청 당사자의 받은/보낸 알림에서만 감춥니다. 신청 상태를 바꾸지 않아 응답 데이터도 없습니다.
export async function dismissMatchingNotification(matchingId: number): Promise<void> {
  if (!USE_MOCKS) {
    await apiRequest<void>(ENDPOINTS.matchings.dismiss(matchingId), { method: 'PATCH' });
    return;
  }

  await mockDelay();
}
