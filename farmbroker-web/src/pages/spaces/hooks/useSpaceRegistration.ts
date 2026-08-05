import { useCallback, useEffect, useState } from 'react';

import { runProfitPrediction } from '@/services/farmerService';
import { createSpace } from '@/services/spaceService';
import type { AiRecommendation, SpaceCreateInput } from '@/types/api';
import type { AsyncStatus } from '@/types/common';

// 등록 확인 단계는 수익 예측 조회와 실제 등록 요청을 각각 다른 상태로 다룹니다.
export function useSpaceRegistration() {
  const [recommendation, setRecommendation] = useState<AiRecommendation | null>(null);
  const [predictionStatus, setPredictionStatus] = useState<AsyncStatus>('idle');
  const [saveStatus, setSaveStatus] = useState<AsyncStatus>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);

  const loadPrediction = useCallback(async () => {
    setPredictionStatus('loading');

    try {
      const result = await runProfitPrediction();
      setRecommendation(result);
      setPredictionStatus('success');
    } catch {
      setPredictionStatus('error');
    }
  }, []);

  const submit = useCallback(async (input: SpaceCreateInput) => {
    setSaveStatus('loading');
    setSaveError(null);

    try {
      await createSpace(input);
      setSaveStatus('success');
    } catch (caught) {
      setSaveError(
        caught instanceof Error ? caught.message : '공간을 등록하지 못했습니다.',
      );
      setSaveStatus('error');
    }
  }, []);

  useEffect(() => {
    void loadPrediction();
  }, [loadPrediction]);

  return {
    recommendation,
    predictionStatus,
    saveStatus,
    saveError,
    reloadPrediction: loadPrediction,
    submit,
  };
}
