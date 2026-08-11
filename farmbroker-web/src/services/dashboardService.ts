import { USE_MOCKS } from '@/api/client';
import { mockDelay } from '@/mocks/handlers';
import {
  mockContracts,
  mockDashboardMetrics,
  mockMatchingRequests,
} from '@/mocks/mockDashboard';
import { getMyMatchings, getReceivedMatchings } from '@/services/matchingService';
import { getMySpaces } from '@/services/spaceService';
import type {
  ContractSummary,
  DashboardMetric,
  MatchingRequest,
  MyMatching,
} from '@/types/api';

export interface DashboardData {
  metrics: DashboardMetric[];
  // 내가 owner로서 받은 신청
  matchings: MatchingRequest[];
  // 내가 farmer로서 보낸 신청
  contracts: ContractSummary[];
}

// 계약 카드는 "내가 보낸 신청"만 다룹니다 — 상대는 언제나 공간 제공자입니다.
function sentToContract(matching: MyMatching): ContractSummary {
  return {
    contractId: matching.matchingId,
    spaceId: matching.spaceId,
    spaceName: matching.spaceTitle,
    counterparty: matching.ownerNickname,
    status: matching.status,
    monthlyRent: matching.monthlyRent,
    type: matching.type,
  };
}

export async function getDashboardData(): Promise<DashboardData> {
  if (USE_MOCKS) {
    await mockDelay();
    return {
      metrics: mockDashboardMetrics,
      matchings: mockMatchingRequests,
      contracts: mockContracts,
    };
  }

  const [spaces, received, sent] = await Promise.all([
    getMySpaces(),
    getReceivedMatchings(),
    getMyMatchings(),
  ]);
  const spacesById = new Map(spaces.map((space) => [space.spaceId, space]));
  const enrichedReceived = received.map((matching) => {
    const space = spacesById.get(matching.spaceId);
    return {
      ...matching,
      spaceImageUrl: space?.imageUrl ?? null,
      monthlyRent: space?.monthlyRent,
    };
  });
  // 내가 거둬들인 신청은 목록에 남기지 않습니다 — 응답 대기중/수락/거절만 보여줍니다.
  const contracts = sent
    .filter((matching) => matching.status !== 'CANCELED')
    .map(sentToContract);
  // 지표는 아래 두 섹션이 실제로 보여주는 목록과 같은 수를 세야 서로 어긋나지 않습니다.
  const receivedWaiting = received.filter((m) => m.status === 'REQUESTED').length;
  const sentWaiting = contracts.filter((contract) => contract.status === 'REQUESTED').length;

  return {
    metrics: [
      {
        id: 'spaces',
        label: '등록 공간',
        value: String(spaces.length),
        helper: `매칭 가능 ${spaces.filter((space) => space.status === 'AVAILABLE').length}개`,
        trend: '',
      },
      {
        id: 'received',
        label: '받은 신청',
        value: String(received.length),
        helper: `응답 대기 ${receivedWaiting}건`,
        trend: '',
      },
      {
        id: 'sent',
        label: '보낸 신청',
        value: String(contracts.length),
        helper: `응답 대기 ${sentWaiting}건`,
        trend: '',
      },
    ],
    matchings: enrichedReceived,
    contracts,
  };
}
