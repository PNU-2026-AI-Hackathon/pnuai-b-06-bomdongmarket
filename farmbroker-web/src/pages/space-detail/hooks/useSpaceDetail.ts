import { useCallback, useEffect, useState } from 'react';

import { getRecommendation, getSpaceDetail } from '@/services/spaceService';
import { applyMatching } from '@/services/matchingService';
import type { AiRecommendation, SpaceDetail } from '@/types/api';
import type { AsyncStatus } from '@/types/common';

// 상세 페이지의 공간 조회와 AI 추천 조회를 분리해 각 상태를 독립적으로 표시합니다.
export function useSpaceDetail(spaceId: number) {
  const [space, setSpace] = useState<SpaceDetail | null>(null);
  const [recommendation, setRecommendation] = useState<AiRecommendation | null>(null);
  const [status, setStatus] = useState<AsyncStatus>('idle');
  const [recommendationStatus, setRecommendationStatus] = useState<AsyncStatus>('idle');
  const [matchingStatus, setMatchingStatus] = useState<AsyncStatus>('idle');
  const [matchingError, setMatchingError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setStatus('loading');
    setError(null);

    try {
      const result = await getSpaceDetail(spaceId);
      setSpace(result);
      setStatus('success');
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : '공간 정보를 불러오지 못했습니다',
      );
      setStatus('error');
    }
  }, [spaceId]);

  const sendMatchingRequest = useCallback(
    async (message: string) => {
      setMatchingStatus('loading');
      setMatchingError(null);
      try {
        await applyMatching({ spaceId, message });
        setMatchingStatus('success');
      } catch (caught) {
        setMatchingError(
          caught instanceof Error ? caught.message : '매칭 신청에 실패했습니다.',
        );
        setMatchingStatus('error');
      }
    },
    [spaceId],
  );

  const loadRecommendation = useCallback(async () => {
    setRecommendationStatus('loading');

    try {
      const result = await getRecommendation(spaceId);
      setRecommendation(result);
      setRecommendationStatus('success');
    } catch {
      setRecommendationStatus('error');
    }
  }, [spaceId]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    space,
    recommendation,
    status,
    recommendationStatus,
    matchingStatus,
    matchingError,
    error,
    reload: load,
    loadRecommendation,
    sendMatchingRequest,
  };
}
