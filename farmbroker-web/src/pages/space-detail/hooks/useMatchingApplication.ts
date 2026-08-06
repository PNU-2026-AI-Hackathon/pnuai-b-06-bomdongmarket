import { useCallback, useRef, useState } from 'react';

import { applyMatching } from '@/services/matchingService';
import type { MatchingApplyResult } from '@/types/api';
import type { AsyncStatus } from '@/types/common';

// 선택된 공간에 대한 단일 매칭 신청의 비동기 상태와 중복 요청을 관리합니다.
export function useMatchingApplication(spaceId: number, enabled: boolean) {
  const [status, setStatus] = useState<AsyncStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MatchingApplyResult | null>(null);
  const isSubmitting = useRef(false);

  const submit = useCallback(
    async (message: string) => {
      if (!enabled || isSubmitting.current) return false;

      isSubmitting.current = true;
      setStatus('loading');
      setError(null);
      setResult(null);
      try {
        const applied = await applyMatching({ spaceId, message });
        setResult(applied);
        setStatus('success');
        return true;
      } catch (caught) {
        setError(
          caught instanceof Error ? caught.message : '매칭 신청을 보내지 못했습니다.',
        );
        setStatus('error');
        return false;
      } finally {
        isSubmitting.current = false;
      }
    },
    [enabled, spaceId],
  );

  return { status, error, result, submit };
}
