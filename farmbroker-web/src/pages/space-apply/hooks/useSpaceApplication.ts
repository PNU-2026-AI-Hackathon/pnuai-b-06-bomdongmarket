import { useCallback, useEffect, useRef, useState } from 'react';

import { applyMatching, cancelMatching, getMyMatchings } from '@/services/matchingService';
import { getSpaceDetail } from '@/services/spaceService';
import type { MatchingType, MyMatching, SpaceDetail } from '@/types/api';
import type { AsyncStatus } from '@/types/common';

// 취소된 신청은 이력으로만 남고 재신청이 가능하므로 "현재 신청"으로 보지 않습니다.
// 공간 상세 카드도 같은 기준으로 판정해야 해서 export 합니다.
export function findActiveApplication(matchings: MyMatching[]) {
  return matchings.find((matching) => matching.status !== 'CANCELED') ?? null;
}

// 신청 화면 한 장에 필요한 공간 정보와 내 신청을 함께 로드하고, 신청/취소 action을 제공합니다.
export function useSpaceApplication(spaceId: number) {
  const [space, setSpace] = useState<SpaceDetail | null>(null);
  const [application, setApplication] = useState<MyMatching | null>(null);
  const [status, setStatus] = useState<AsyncStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState<AsyncStatus>('idle');
  const [actionError, setActionError] = useState<string | null>(null);
  // 확인 팝업을 거치더라도 더블 클릭·엔터 연타로 두 번 제출될 수 있어 ref로 막습니다.
  const isRunning = useRef(false);

  const load = useCallback(async () => {
    setStatus('loading');
    setError(null);

    try {
      const [detail, matchings] = await Promise.all([
        getSpaceDetail(spaceId),
        getMyMatchings(spaceId),
      ]);
      setSpace(detail);
      setApplication(findActiveApplication(matchings));
      setStatus('success');
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : '신청 정보를 불러오지 못했습니다',
      );
      setStatus('error');
    }
  }, [spaceId]);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = useCallback(
    async (type: MatchingType, message: string) => {
      if (isRunning.current) return false;

      isRunning.current = true;
      setActionStatus('loading');
      setActionError(null);
      try {
        const applied = await applyMatching({ spaceId, type, message });
        // 신청 응답에는 공간 요약이 없으므로 이미 로드한 상세 정보로 조회 모드 카드를 채웁니다.
        setApplication({
          matchingId: applied.matchingId,
          spaceId: applied.spaceId,
          spaceTitle: space?.title ?? '',
          spaceImageUrl: space?.imageUrls[0] ?? null,
          monthlyRent: space?.monthlyRent ?? 0,
          ownerNickname: space?.owner.nickname ?? '',
          type: applied.type,
          message: applied.message,
          status: applied.status,
          createdAt: applied.createdAt,
          respondedAt: null,
        });
        setActionStatus('success');
        return true;
      } catch (caught) {
        setActionError(
          caught instanceof Error ? caught.message : '매칭 신청을 보내지 못했습니다.',
        );
        setActionStatus('error');
        return false;
      } finally {
        isRunning.current = false;
      }
    },
    [space, spaceId],
  );

  const cancel = useCallback(async () => {
    if (isRunning.current || !application) return false;

    isRunning.current = true;
    setActionStatus('loading');
    setActionError(null);
    try {
      const result = await cancelMatching(application.matchingId);
      // CANCELED가 되면 현재 신청이 사라져 같은 공간에 다시 신청할 수 있는 상태로 돌아갑니다.
      setApplication(
        result.status === 'CANCELED'
          ? null
          : { ...application, status: result.status, respondedAt: result.respondedAt },
      );
      setActionStatus('success');
      return true;
    } catch (caught) {
      setActionError(
        caught instanceof Error ? caught.message : '매칭 신청을 취소하지 못했습니다.',
      );
      setActionStatus('error');
      return false;
    } finally {
      isRunning.current = false;
    }
  }, [application]);

  return {
    space,
    application,
    status,
    error,
    actionStatus,
    actionError,
    reload: load,
    submit,
    cancel,
  };
}
