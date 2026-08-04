import { useCallback, useEffect, useRef, useState } from 'react';

import { applyMatching, getMyMatchings } from '@/services/matchingService';
import type { MatchingApplyInput, MatchingApplyResult, MyMatching } from '@/types/api';
import type { AsyncStatus } from '@/types/common';

interface UseSpaceMatchingOptions {
  enabled: boolean;
}

// 공간 목록의 매칭 신청과 내 신청 결과를 한 흐름으로 관리합니다.
export function useSpaceMatching({ enabled }: UseSpaceMatchingOptions) {
  const [requests, setRequests] = useState<MyMatching[]>([]);
  const [requestsStatus, setRequestsStatus] = useState<AsyncStatus>('idle');
  const [requestsError, setRequestsError] = useState<string | null>(null);
  const [submitStatus, setSubmitStatus] = useState<AsyncStatus>('idle');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<MatchingApplyResult | null>(null);
  const isSubmitting = useRef(false);
  const latestRequestsLoad = useRef(0);

  const loadRequests = useCallback(async () => {
    if (!enabled) return;

    const loadId = ++latestRequestsLoad.current;
    setRequestsStatus('loading');
    setRequestsError(null);
    try {
      const result = await getMyMatchings();
      if (loadId !== latestRequestsLoad.current) return;
      setRequests(result);
      setRequestsStatus('success');
    } catch (caught) {
      if (loadId !== latestRequestsLoad.current) return;
      setRequestsError(
        caught instanceof Error
          ? caught.message
          : '내 매칭 신청 결과를 불러오지 못했습니다.',
      );
      setRequestsStatus('error');
    }
  }, [enabled]);

  useEffect(() => {
    if (enabled) void loadRequests();
  }, [enabled, loadRequests]);

  const submit = useCallback(
    async (input: MatchingApplyInput) => {
      if (!enabled || isSubmitting.current) return false;

      isSubmitting.current = true;
      setSubmitStatus('loading');
      setSubmitError(null);
      setSubmitted(null);
      try {
        const result = await applyMatching(input);
        setSubmitted(result);
        setSubmitStatus('success');
        await loadRequests();
        return true;
      } catch (caught) {
        const message =
          caught instanceof Error ? caught.message : '매칭 신청을 보내지 못했습니다.';
        setSubmitError(message);
        setSubmitStatus('error');
        // 중복 오류는 이전 요청이 성공했을 가능성이 있으므로 결과를 함께 새로고침합니다.
        if (
          caught instanceof Error &&
          'errorCode' in caught &&
          caught.errorCode === 'MATCHING_DUPLICATED'
        ) {
          void loadRequests();
        }
        return false;
      } finally {
        isSubmitting.current = false;
      }
    },
    [enabled, loadRequests],
  );

  return {
    requests,
    requestsStatus,
    requestsError,
    submitStatus,
    submitError,
    submitted,
    loadRequests,
    submit,
  };
}
