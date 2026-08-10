import { apiRequest, USE_MOCKS } from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
import { mockDelay } from '@/mocks/handlers';
import { mockMatchingRequests } from '@/mocks/mockDashboard';
import type {
  MatchingApplyInput,
  MatchingApplyResult,
  MatchingRequest,
  MatchingStatus,
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

// 세 상태 전이 모두 PATCH /matchings/{id}/{action} + MatchingStatusResult 응답으로 형태가 같습니다.
const statusByAction: Record<MatchingAction, MatchingStatus> = {
  accept: 'ACCEPTED',
  reject: 'REJECTED',
  cancel: 'CANCELED',
};

type MatchingAction = 'accept' | 'reject' | 'cancel';

async function updateMatchingStatus(
  matchingId: number,
  action: MatchingAction,
): Promise<MatchingStatusResult> {
  if (!USE_MOCKS) {
    const response = await apiRequest<MatchingStatusResult>(
      ENDPOINTS.matchings[action](matchingId),
      { method: 'PATCH' },
    );
    return response.data;
  }

  await mockDelay();
  return {
    matchingId,
    status: statusByAction[action],
    respondedAt: new Date().toISOString(),
  };
}

export function acceptMatching(matchingId: number) {
  return updateMatchingStatus(matchingId, 'accept');
}

export function rejectMatching(matchingId: number) {
  return updateMatchingStatus(matchingId, 'reject');
}

// 신청자 본인이 아직 응답받지 않은 신청을 거둬들입니다. 취소 후 같은 공간에 재신청할 수 있습니다.
export function cancelMatching(matchingId: number) {
  return updateMatchingStatus(matchingId, 'cancel');
}
