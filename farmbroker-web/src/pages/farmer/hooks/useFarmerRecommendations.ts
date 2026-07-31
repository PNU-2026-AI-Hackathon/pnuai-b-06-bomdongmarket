import { useCallback, useEffect, useState } from 'react';

import {
  getFarmerRecommendations,
  type FarmerRecommendation,
} from '@/services/farmerService';
import type { AsyncStatus } from '@/types/common';

// 추천 공간 조회 상태를 페이지에서 분리해 필터/목록 UI가 데이터 소스에 묶이지 않게 합니다.
export function useFarmerRecommendations() {
  const [recommendations, setRecommendations] = useState<FarmerRecommendation[]>([]);
  const [status, setStatus] = useState<AsyncStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setStatus('loading');
    setError(null);

    try {
      const result = await getFarmerRecommendations();
      setRecommendations(result);
      setStatus('success');
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : '추천 공간을 불러오지 못했습니다',
      );
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { recommendations, status, error, reload: load };
}
