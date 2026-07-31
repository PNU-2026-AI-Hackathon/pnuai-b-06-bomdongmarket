import type { ContractSummary, DashboardMetric, MatchingRequest } from '@/types/api';

export const mockDashboardMetrics: DashboardMetric[] = [
  {
    label: '등록 공간',
    value: '4',
    helper: '매칭 가능한 공간 2개',
    trend: '이번 주 +1',
  },
  {
    label: '매칭 신청',
    value: '12',
    helper: '검토 대기 5건',
    trend: '신규 +4',
  },
  {
    label: '예상 수익',
    value: '월 192만원',
    helper: '월 순수익 예측',
    trend: '+18%',
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
    message: '바질과 민트를 시작으로 인근 식당 납품용 허브를 생산하려고 합니다.',
    status: 'ACCEPTED',
    createdAt: '2026-06-30T09:30:00',
    respondedAt: '2026-07-01T10:00:00',
  },
];

export const mockContracts: ContractSummary[] = [
  {
    contractId: 1,
    spaceName: '장전동 상가 공실',
    counterparty: '도심농부 김민준',
    status: '신청',
    monthlyRent: 500000,
    period: '2026.07 - 2027.06',
  },
  {
    contractId: 2,
    spaceName: '서면 재배 공간',
    counterparty: '바질웍스',
    status: '완료',
    monthlyRent: 350000,
    period: '2026.07 - 2026.12',
  },
  {
    contractId: 3,
    spaceName: '해운대 루프탑 온실',
    counterparty: '루프앤루츠',
    status: '검토',
    monthlyRent: 920000,
    period: '2026.08 - 2027.07',
  },
];
