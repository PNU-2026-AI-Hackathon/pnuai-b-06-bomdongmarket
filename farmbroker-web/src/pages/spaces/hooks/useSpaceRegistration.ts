import { useCallback, useEffect, useState } from 'react';

import { getProfitEstimates } from '@/services/profitService';
import { createSpace } from '@/services/spaceService';
import type { ProfitEstimate, SpaceCreateInput } from '@/types/api';
import type { AsyncStatus } from '@/types/common';

// 등록 확인 단계는 수익 예측 조회와 실제 등록 요청을 각각 다른 상태로 다룹니다.
export function useSpaceRegistration(input: SpaceCreateInput) {
  const [estimates, setEstimates] = useState<ProfitEstimate[]>([]);
  const [predictionStatus, setPredictionStatus] = useState<AsyncStatus>('idle');
  const [saveStatus, setSaveStatus] = useState<AsyncStatus>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);

  const { area, monthlyRent } = input;

  const loadPrediction = useCallback(async () => {
    setPredictionStatus('loading');

    try {
      const result = await getProfitEstimates({ area, monthlyRent });
      setEstimates(result);
      setPredictionStatus(result.length > 0 ? 'success' : 'error');
    } catch {
      setPredictionStatus('error');
    }
  }, [area, monthlyRent]);

  const submit = useCallback(async () => {
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
  }, [input]);

  useEffect(() => {
    void loadPrediction();
  }, [loadPrediction]);

  return {
    estimates,
    predictionStatus,
    saveStatus,
    saveError,
    reloadPrediction: loadPrediction,
    submit,
  };
}
