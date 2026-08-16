import { useCallback, useEffect, useState } from 'react';

import { getDashboardData } from '@/services/dashboardService';
import {
  acceptMatching,
  dismissReceivedMatching,
  rejectMatching,
} from '@/services/matchingService';
import type {
  CartLine,
  ContractSummary,
  ContractedSpaceSummary,
  MatchingRequest,
  SpaceSummary,
} from '@/types/api';
import type { AsyncStatus } from '@/types/common';

// 대시보드의 공간·신청·장바구니 데이터와 받은 신청 처리 상태를 관리합니다.
export function useDashboard() {
  const [ownedSpaces, setOwnedSpaces] = useState<SpaceSummary[]>([]);
  const [contractedSpaces, setContractedSpaces] = useState<ContractedSpaceSummary[]>([]);
  const [receivedApplications, setReceivedApplications] = useState<MatchingRequest[]>([]);
  const [sentApplications, setSentApplications] = useState<ContractSummary[]>([]);
  const [cartItems, setCartItems] = useState<CartLine[]>([]);
  const [status, setStatus] = useState<AsyncStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [updatingMatchingId, setUpdatingMatchingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setStatus('loading');
    setError(null);

    try {
      const result = await getDashboardData();
      setOwnedSpaces(result.ownedSpaces);
      setContractedSpaces(result.contractedSpaces);
      setReceivedApplications(result.receivedApplications);
      setSentApplications(result.sentApplications);
      setCartItems(result.cartItems);
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
      const application = receivedApplications.find(
        (matching) => matching.matchingId === matchingId,
      );

      try {
        const result =
          action === 'accept'
            ? await acceptMatching(matchingId)
            : await rejectMatching(matchingId);
        setReceivedApplications((current) =>
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
        if (action === 'accept' && application) {
          setContractedSpaces((current) => {
            if (current.some((space) => space.spaceId === application.spaceId)) {
              return current;
            }
            return [
              ...current,
              {
                matchingId: application.matchingId,
                spaceId: application.spaceId,
                spaceName: application.spaceTitle,
                imageUrl: application.spaceImageUrl ?? null,
                status: 'ACCEPTED',
              },
            ];
          });
        }
      } catch (caught) {
        setActionError(
          caught instanceof Error ? caught.message : '매칭 처리에 실패했습니다.',
        );
      } finally {
        setUpdatingMatchingId(null);
      }
    },
    [receivedApplications],
  );

  // 검토가 끝난 신청은 알림 목록에서만 치우고, 이미 만들어진 계약 공간은 유지합니다.
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
    cartItems,
    status,
    error,
    actionError,
    updatingMatchingId,
    reload: load,
    respondToMatching,
    dismissMatching,
  };
}
