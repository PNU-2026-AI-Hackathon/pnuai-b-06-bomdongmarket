import { useCallback, useEffect, useState } from 'react';

import {
  getContracts,
  getDashboardMetrics,
  getReceivedMatchings,
} from '../../../services/dashboardService';
import type {
  ContractSummary,
  DashboardMetric,
  MatchingRequest,
} from '../../../types/api';
import type { AsyncStatus } from '../../../types/common';

// 대시보드에 필요한 세 데이터 묶음을 병렬로 로드해 페이지 렌더링을 단순화합니다.
export function useDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetric[]>([]);
  const [matchings, setMatchings] = useState<MatchingRequest[]>([]);
  const [contracts, setContracts] = useState<ContractSummary[]>([]);
  const [status, setStatus] = useState<AsyncStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setStatus('loading');
    setError(null);

    try {
      const [metricResult, matchingResult, contractResult] = await Promise.all([
        getDashboardMetrics(),
        getReceivedMatchings(),
        getContracts(),
      ]);
      setMetrics(metricResult);
      setMatchings(matchingResult);
      setContracts(contractResult);
      setStatus('success');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to load dashboard');
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { metrics, matchings, contracts, status, error, reload: load };
}
