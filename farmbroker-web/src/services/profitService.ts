import { apiRequest, USE_MOCKS } from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
import { mockDelay } from '@/mocks/handlers';
import { createMockProfitEstimates } from '@/mocks/mockProfitEstimates';
import type { ProfitEstimate, ProfitEstimateInput } from '@/types/api';

// 등록 전 수익 예측입니다. spaceId가 아직 없으므로 면적·월세만 보내고
// 서버가 지원 작물별 결과를 배분수익 내림차순으로 돌려줍니다(첫 항목이 대표 작물).
export async function getProfitEstimates(
  input: ProfitEstimateInput,
): Promise<ProfitEstimate[]> {
  if (!USE_MOCKS) {
    const response = await apiRequest<ProfitEstimate[]>(ENDPOINTS.profit.estimate, {
      method: 'POST',
      body: input,
    });
    return response.data;
  }

  await mockDelay();
  return createMockProfitEstimates(input);
}
