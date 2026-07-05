import type { ContractSummary, DashboardMetric, MatchingRequest } from '../types/api';

export const mockDashboardMetrics: DashboardMetric[] = [
  {
    label: 'Registered Spaces',
    value: '4',
    helper: '2 available for matching',
    trend: '+1 this week',
  },
  {
    label: 'Matching Requests',
    value: '12',
    helper: '5 waiting for review',
    trend: '+4 new',
  },
  {
    label: 'Estimated Profit',
    value: '₩1.92M',
    helper: 'monthly net estimate',
    trend: '+18%',
  },
];

export const mockMatchingRequests: MatchingRequest[] = [
  {
    matchingId: 1,
    spaceId: 1,
    spaceTitle: 'Jangjeon-dong 20 pyeong retail space',
    spaceImageUrl:
      'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?auto=format&fit=crop&w=900&q=80',
    monthlyRent: 500000,
    ownerNickname: 'Green Space Lab',
    farmerId: 2,
    farmerNickname: 'Urban Farmer Kim',
    message:
      'I want to grow lettuce and herbs as a small smart farm with local delivery.',
    status: 'REQUESTED',
    createdAt: '2026-07-05T14:00:00',
    respondedAt: null,
  },
  {
    matchingId: 2,
    spaceId: 2,
    spaceTitle: 'Seomyeon basement grow room',
    spaceImageUrl:
      'https://images.unsplash.com/photo-1492496913980-501348b61469?auto=format&fit=crop&w=900&q=80',
    monthlyRent: 350000,
    ownerNickname: 'Seomyeon Owner',
    farmerId: 7,
    farmerNickname: 'Basil Works',
    message: 'Herb production for nearby restaurants, starting with basil and mint.',
    status: 'ACCEPTED',
    createdAt: '2026-06-30T09:30:00',
    respondedAt: '2026-07-01T10:00:00',
  },
];

export const mockContracts: ContractSummary[] = [
  {
    contractId: 1,
    spaceName: 'Jangjeon retail space',
    counterparty: 'Urban Farmer Kim',
    status: 'Request',
    monthlyRent: 500000,
    period: 'Jul 2026 - Jun 2027',
  },
  {
    contractId: 2,
    spaceName: 'Seomyeon grow room',
    counterparty: 'Basil Works',
    status: 'Complete',
    monthlyRent: 350000,
    period: 'Jul 2026 - Dec 2026',
  },
  {
    contractId: 3,
    spaceName: 'Haeundae rooftop greenhouse',
    counterparty: 'Roof & Roots',
    status: 'Review',
    monthlyRent: 920000,
    period: 'Aug 2026 - Jul 2027',
  },
];
