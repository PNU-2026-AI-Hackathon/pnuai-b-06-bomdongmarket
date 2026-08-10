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
  MatchingStatus,
  MyMatching,
} from '@/types/api';

export interface DashboardData {
  metrics: DashboardMetric[];
  // 내가 owner로서 받은 신청
  matchings: MatchingRequest[];
  // 내가 farmer로서 보낸 신청
  contracts: ContractSummary[];
}

function toContractStatus(status: MatchingStatus): ContractSummary['status'] {
  if (status === 'ACCEPTED') return '완료';
  if (status === 'REQUESTED') return '신청';
  return '검토';
}

// 계약 카드는 "내가 보낸 신청"만 다룹니다 — 상대는 언제나 공간 제공자입니다.
function sentToContract(matching: MyMatching): ContractSummary {
  return {
    contractId: matching.matchingId,
    spaceId: matching.spaceId,
    spaceName: matching.spaceTitle,
    counterparty: matching.ownerNickname,
    status: toContractStatus(matching.status),
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
  const contracts = sent.map(sentToContract);
  const allStatuses = [...received, ...sent].map((matching) => matching.status);
  const requestedCount = allStatuses.filter((status) => status === 'REQUESTED').length;
  const acceptedCount = allStatuses.filter((status) => status === 'ACCEPTED').length;

  return {
    metrics: [
      {
        label: '등록 공간',
        value: String(spaces.length),
        helper: `매칭 가능 ${spaces.filter((space) => space.status === 'AVAILABLE').length}개`,
        trend: '',
      },
      {
        label: '매칭 신청',
        value: String(allStatuses.length),
        helper: `검토 대기 ${requestedCount}건`,
        trend: '',
      },
      {
        label: '매칭 완료',
        value: String(acceptedCount),
        helper: '수락된 신청',
        trend: '',
      },
    ],
    matchings: enrichedReceived,
    contracts,
  };
}
