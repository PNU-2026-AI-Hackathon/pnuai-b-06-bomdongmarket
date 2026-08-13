import type { ContractSummary, DashboardMetric, MatchingRequest } from '@/types/api';

export const mockDashboardMetrics: DashboardMetric[] = [
  {
    id: 'spaces',
    label: '등록 공간',
    value: '4',
    helper: '매칭 가능한 공간 2개',
    trend: '이번 주 +1',
  },
  {
    id: 'received',
    label: '받은 신청',
    value: '12',
    helper: '응답 대기 5건',
    trend: '신규 +4',
  },
  {
    id: 'sent',
    label: '보낸 신청',
    value: '3',
    helper: '응답 대기 1건',
    trend: '',
  },
];

export const mockMatchingRequests: MatchingRequest[] = [
  {
    matchingId: 1,
    spaceId: 1,
    spaceTitle: '부산대 앞 20평 상가 공실',
    spaceImageUrl:
      'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?auto=format&fit=crop&w=900&q=80',
    monthlyRent: 500000,
    ownerNickname: '그린스페이스랩',
    farmerId: 2,
    farmerNickname: '도심농부 김민준',
    type: 'PROFIT',
    message:
      '상추와 허브류를 재배해 근거리 배송까지 운영하는 소형 스마트팜을 만들고 싶습니다.',
    status: 'REQUESTED',
    createdAt: '2026-07-05T14:00:00',
    respondedAt: null,
  },
  {
    matchingId: 2,
    spaceId: 2,
    spaceTitle: '서면 지하 재배 공간',
    spaceImageUrl:
      'https://images.unsplash.com/photo-1492496913980-501348b61469?auto=format&fit=crop&w=900&q=80',
    monthlyRent: 350000,
    ownerNickname: '서면공간주',
    farmerId: 7,
    farmerNickname: '바질웍스',
    type: 'HOBBY',
    message: '바질과 민트를 시작으로 인근 식당 납품용 허브를 생산하려고 합니다.',
    status: 'ACCEPTED',
    createdAt: '2026-06-30T09:30:00',
    respondedAt: '2026-07-01T10:00:00',
  },
];

export const mockContracts: ContractSummary[] = [
  {
    contractId: 1,
    spaceId: 1,
    spaceName: '장전동 상가 공실',
    counterparty: '그린스페이스랩',
    status: 'REQUESTED',
    monthlyRent: 500000,
    type: 'PROFIT',
  },
  {
    contractId: 2,
    spaceId: 2,
    spaceName: '서면 재배 공간',
    counterparty: '서면공간주',
    status: 'ACCEPTED',
    monthlyRent: 350000,
    type: 'HOBBY',
  },
  {
    contractId: 3,
    spaceId: 3,
    spaceName: '해운대 루프탑 온실',
    counterparty: '루프앤루츠',
    status: 'REJECTED',
    monthlyRent: 920000,
    type: null,
  },
];
