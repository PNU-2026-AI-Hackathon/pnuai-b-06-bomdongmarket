import { useCallback, useEffect, useState } from 'react';

import { getApplicationNotifications } from '@/services/dashboardService';
import { dismissReceivedMatching } from '@/services/matchingService';
import type { ContractSummary, MatchingRequest } from '@/types/api';
import type { AsyncStatus } from '@/types/common';

// 로그인 사용자가 어느 화면에 있든 헤더에서 신청 알림을 확인할 수 있게 목록을 관리합니다.
export function useApplicationNotifications(isEnabled: boolean, isOwner: boolean) {
  const [receivedApplications, setReceivedApplications] = useState<MatchingRequest[]>([]);
  const [sentApplications, setSentApplications] = useState<ContractSummary[]>([]);
  const [status, setStatus] = useState<AsyncStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isEnabled) return;

    setStatus('loading');
    setError(null);

    try {
      const result = await getApplicationNotifications(isOwner);
      setReceivedApplications(result.receivedApplications);
      setSentApplications(result.sentApplications);
      setStatus('success');
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : '신청 알림을 불러오지 못했습니다.',
      );
      setStatus('error');
    }
  }, [isEnabled, isOwner]);

  useEffect(() => {
    void load();
  }, [load]);

  const dismissReceived = useCallback(
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
    receivedApplications,
    sentApplications,
    status,
    error,
    actionError,
    reload: load,
    dismissReceived,
  };
}
