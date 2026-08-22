import { useCallback, useEffect, useState } from 'react';

import { getDashboardData } from '@/services/dashboardService';
import type { WishlistLine, ContractedSpaceSummary, SpaceSummary } from '@/types/api';
import type { AsyncStatus } from '@/types/common';

// 대시보드의 공간·계약·찜 데이터를 불러옵니다.
export function useDashboard() {
  const [ownedSpaces, setOwnedSpaces] = useState<SpaceSummary[]>([]);
  const [contractedSpaces, setContractedSpaces] = useState<ContractedSpaceSummary[]>([]);
  const [wishlistItems, setWishlistItems] = useState<WishlistLine[]>([]);
  const [status, setStatus] = useState<AsyncStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setStatus('loading');
    setError(null);

    try {
      const result = await getDashboardData();
      setOwnedSpaces(result.ownedSpaces);
      setContractedSpaces(result.contractedSpaces);
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

  return {
    ownedSpaces,
    contractedSpaces,
    wishlistItems,
    status,
    error,
    reload: load,
  };
}
