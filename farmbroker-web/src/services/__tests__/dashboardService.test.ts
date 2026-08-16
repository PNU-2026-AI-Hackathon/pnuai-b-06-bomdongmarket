import { describe, expect, it } from 'vitest';

import { buildContractedSpaces } from '@/services/dashboardService';
import type { MatchingRequest, MyMatching } from '@/types/api';

function receivedApplication(overrides: Partial<MatchingRequest> = {}): MatchingRequest {
  return {
    matchingId: 1,
    spaceId: 10,
    spaceTitle: '장전동 스마트팜',
    spaceImageUrl: null,
    farmerId: 2,
    farmerNickname: '도시농부',
    type: 'PROFIT',
    message: '신청합니다.',
    status: 'ACCEPTED',
    createdAt: '2026-08-01T00:00:00',
    respondedAt: '2026-08-02T00:00:00',
    ...overrides,
  };
}

function sentApplication(overrides: Partial<MyMatching> = {}): MyMatching {
  return {
    matchingId: 2,
    spaceId: 10,
    spaceTitle: '장전동 스마트팜',
    spaceImageUrl: '/space.jpg',
    monthlyRent: 300000,
    ownerNickname: '공간 제공자',
    type: 'PROFIT',
    message: '신청합니다.',
    status: 'ACCEPTED',
    createdAt: '2026-08-01T00:00:00',
    respondedAt: '2026-08-02T00:00:00',
    ...overrides,
  };
}

describe('buildContractedSpaces', () => {
  it('수락된 받은·보낸 신청만 합치고 같은 공간은 한 번만 표시한다', () => {
    const result = buildContractedSpaces(
      [
        receivedApplication(),
        receivedApplication({ matchingId: 3, spaceId: 30, status: 'REQUESTED' }),
      ],
      [
        sentApplication(),
        sentApplication({ matchingId: 4, spaceId: 40, status: 'REJECTED' }),
      ],
    );

    expect(result).toEqual([
      {
        matchingId: 2,
        spaceId: 10,
        spaceName: '장전동 스마트팜',
        imageUrl: '/space.jpg',
        status: 'ACCEPTED',
      },
    ]);
  });
});
