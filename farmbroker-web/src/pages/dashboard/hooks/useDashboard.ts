import { useCallback, useEffect, useState } from 'react';

import { getDashboardData } from '@/services/dashboardService';
import { dismissReceivedMatching } from '@/services/matchingService';
import type {
  WishlistLine,
  ContractSummary,
  ContractedSpaceSummary,
  MatchingRequest,
  SpaceSummary,
} from '@/types/api';
import type { AsyncStatus } from '@/types/common';

// 대시보드의 공간·신청·찜 데이터를 불러오고 받은 신청 감추기를 처리합니다.
export function useDashboard() {
  const [ownedSpaces, setOwnedSpaces] = useState<SpaceSummary[]>([]);
  const [contractedSpaces, setContractedSpaces] = useState<ContractedSpaceSummary[]>([]);
  const [receivedApplications, setReceivedApplications] = useState<MatchingRequest[]>([]);
  const [sentApplications, setSentApplications] = useState<ContractSummary[]>([]);
  const [wishlistItems, setWishlistItems] = useState<WishlistLine[]>([]);
  const [status, setStatus] = useState<AsyncStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setStatus('loading');
    setError(null);

    try {
      const result = await getDashboardData();
      setOwnedSpaces(result.ownedSpaces);
      setContractedSpaces(result.contractedSpaces);
      setReceivedApplications(result.receivedApplications);
      setSentApplications(result.sentApplications);
      setWishlistItems(result.wishlistItems);
      setStatus('success');
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : '대시보드를 불러오지 못했습니다',
      );
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // 협의가 끝난 신청은 알림 목록에서만 치우고, 이미 만들어진 계약 공간은 유지합니다.
  const dismissMatching = useCallback(
    async (matchingId: number) => {
      setActionError(null);
      const previousApplications = receivedApplications;

      setReceivedApplications((current) =>
        current.filter((matching) => matching.matchingId !== matchingId),
      );

      try {
        await dismissReceivedMatching(matchingId);
      } catch (caught) {
        setReceivedApplications(previousApplications);
        setActionError(
          caught instanceof Error ? caught.message : '신청을 목록에서 지우지 못했습니다.',
        );
      }
    },
    [receivedApplications],
  );

  return {
    ownedSpaces,
    contractedSpaces,
    receivedApplications,
    sentApplications,
    wishlistItems,
    status,
    error,
    actionError,
    reload: load,
    dismissMatching,
  };
}
