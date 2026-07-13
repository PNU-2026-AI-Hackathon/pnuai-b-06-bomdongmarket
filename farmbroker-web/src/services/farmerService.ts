import { mockDelay } from '@/mocks/handlers';
import { mockRecommendation } from '@/mocks/mockSpaces';
import type { AiRecommendation, SpaceSummary } from '@/types/api';
import { getSpaces } from '@/services/spaceService';
import { getCrops } from '@/services/cropService';

export interface FarmerRecommendation extends SpaceSummary {
  matchingScore: number;
  recommendedCrop: string;
  expectedProfit: number;
}

export async function getFarmerRecommendations(): Promise<FarmerRecommendation[]> {
  const [spaces, crops] = await Promise.all([
    getSpaces({ size: 6, sort: 'rent' }),
    getCrops(),
  ]);

  return spaces.content.map((space, index) => ({
    ...space,
    matchingScore: [94, 88, 82, 77][index] ?? 74,
    recommendedCrop: crops[index % crops.length]?.name ?? '추천 작물 확인 중',
    expectedProfit: Math.max(
      0,
      Math.round(
        space.area * (crops[index % crops.length]?.avgPricePerKg ?? 0) -
          space.monthlyRent,
      ),
    ),
  }));
}

export async function runProfitPrediction(): Promise<AiRecommendation> {
  await mockDelay();
  return mockRecommendation;
}
