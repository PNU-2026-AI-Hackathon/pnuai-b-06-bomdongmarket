import type { MatchingRequest } from '@/types/api';

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
