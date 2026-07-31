import { useCallback, useEffect, useState } from 'react';

import { getDashboardData } from '@/services/dashboardService';
import { acceptMatching, rejectMatching } from '@/services/matchingService';
import type { ContractSummary, DashboardMetric, MatchingRequest } from '@/types/api';
import type { AsyncStatus } from '@/types/common';

// 대시보드에 필요한 세 데이터 묶음을 병렬로 로드해 페이지 렌더링을 단순화합니다.
export function useDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetric[]>([]);
  const [matchings, setMatchings] = useState<MatchingRequest[]>([]);
  const [contracts, setContracts] = useState<ContractSummary[]>([]);
  const [status, setStatus] = useState<AsyncStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [updatingMatchingId, setUpdatingMatchingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setStatus('loading');
    setError(null);

    try {
      const result = await getDashboardData();
      setMetrics(result.metrics);
      setMatchings(result.matchings);
      setContracts(result.contracts);
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

  const respondToMatching = useCallback(
    async (matchingId: number, action: 'accept' | 'reject') => {
      setUpdatingMatchingId(matchingId);
      setActionError(null);
      try {
        const result =
          action === 'accept'
            ? await acceptMatching(matchingId)
            : await rejectMatching(matchingId);
        setMatchings((current) =>
          current.map((matching) =>
            matching.matchingId === matchingId
              ? {
                  ...matching,
                  status: result.status,
                  respondedAt: result.respondedAt,
                }
              : matching,
          ),
        );
        setContracts((current) =>
          current.map((contract) =>
            contract.contractId === matchingId
              ? {
                  ...contract,
                  status: action === 'accept' ? '완료' : '검토',
                  period: action === 'accept' ? '협의 완료' : contract.period,
                }
              : contract,
          ),
        );
      } catch (caught) {
        setActionError(
          caught instanceof Error ? caught.message : '매칭 처리에 실패했습니다.',
        );
      } finally {
        setUpdatingMatchingId(null);
      }
    },
    [],
  );

  return {
    metrics,
    matchings,
    contracts,
    status,
    error,
    actionError,
    updatingMatchingId,
    reload: load,
    respondToMatching,
  };
}
