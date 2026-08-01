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

export async function getMyMatchings(): Promise<MyMatching[]> {
  if (!USE_MOCKS) {
    const response = await apiRequest<MyMatching[]>(ENDPOINTS.matchings.myRequests);
    return response.data;
  }

  await mockDelay();
  return mockMatchingRequests.map((request) => ({
    matchingId: request.matchingId,
    spaceId: request.spaceId,
    spaceTitle: request.spaceTitle,
    spaceImageUrl: request.spaceImageUrl ?? null,
    monthlyRent: request.monthlyRent ?? 0,
    ownerNickname: request.ownerNickname ?? '공간 제공자',
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

async function updateMatchingStatus(
  matchingId: number,
  action: 'accept' | 'reject',
): Promise<MatchingStatusResult> {
  if (!USE_MOCKS) {
    const endpoint =
      action === 'accept'
        ? ENDPOINTS.matchings.accept(matchingId)
        : ENDPOINTS.matchings.reject(matchingId);
    const response = await apiRequest<MatchingStatusResult>(endpoint, {
      method: 'PATCH',
    });
    return response.data;
  }

  await mockDelay();
  const status: MatchingStatus = action === 'accept' ? 'ACCEPTED' : 'REJECTED';
  return { matchingId, status, respondedAt: new Date().toISOString() };
}

export function acceptMatching(matchingId: number) {
  return updateMatchingStatus(matchingId, 'accept');
}

export function rejectMatching(matchingId: number) {
  return updateMatchingStatus(matchingId, 'reject');
}
