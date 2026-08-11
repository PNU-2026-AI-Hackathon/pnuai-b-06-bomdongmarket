import { useCallback, useEffect, useState } from 'react';

import { getDashboardData } from '@/services/dashboardService';
import {
  acceptMatching,
  dismissReceivedMatching,
  rejectMatching,
} from '@/services/matchingService';
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
        // 계약 카드는 내가 보낸 신청이라 여기서 처리하는 받은 신청과 별개다 — 함께 갱신하지 않는다.
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

  // 검토가 끝난 신청을 받은 목록에서 치웁니다.
  // 서버가 ownerDismissedAt을 기록해 다시 불러와도 빠진 상태가 유지됩니다.
  // 실패하면 화면을 원래대로 되돌려, 지워진 것처럼 보이는데 서버에는 남는 상황을 막습니다.
  const dismissMatching = useCallback(async (matchingId: number) => {
    setActionError(null);
    const previousMatchings = matchings;
    const previousMetrics = metrics;

    setMatchings((current) =>
      current.filter((matching) => matching.matchingId !== matchingId),
    );
    // 목록에서 빠진 만큼 '받은 신청' 수도 함께 줄입니다.
    // 감출 수 있는 건 이미 응답한 신청뿐이라 helper의 '응답 대기 N건'은 그대로입니다.
    setMetrics((current) =>
      current.map((metric) =>
        metric.id === 'received'
          ? { ...metric, value: String(Math.max(0, Number(metric.value) - 1)) }
          : metric,
      ),
    );

    try {
      await dismissReceivedMatching(matchingId);
    } catch (caught) {
      setMatchings(previousMatchings);
      setMetrics(previousMetrics);
      setActionError(
        caught instanceof Error ? caught.message : '신청을 목록에서 지우지 못했습니다.',
      );
    }
  }, [matchings, metrics]);

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
    dismissMatching,
  };
}
