import { useCallback, useEffect, useState } from 'react';

import { getApplicationNotifications } from '@/services/dashboardService';
import { dismissMatchingNotification } from '@/services/matchingService';
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

  const dismiss = useCallback(
    async (matchingId: number, direction: 'received' | 'sent') => {
      setActionError(null);
      const previousReceived = receivedApplications;
      const previousSent = sentApplications;
      if (direction === 'received') {
        setReceivedApplications((current) =>
          current.filter((matching) => matching.matchingId !== matchingId),
        );
      } else {
        setSentApplications((current) =>
          current.filter((matching) => matching.contractId !== matchingId),
        );
      }

      try {
        await dismissMatchingNotification(matchingId);
      } catch (caught) {
        setReceivedApplications(previousReceived);
        setSentApplications(previousSent);
        setActionError(
          caught instanceof Error ? caught.message : '신청을 목록에서 지우지 못했습니다.',
        );
      }
    },
    [receivedApplications, sentApplications],
  );

  return {
    receivedApplications,
    sentApplications,
    status,
    error,
    actionError,
    reload: load,
    dismiss,
  };
}
