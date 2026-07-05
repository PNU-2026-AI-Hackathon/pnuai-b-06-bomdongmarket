import { mockDelay } from '../mocks/handlers';
import { mockRecommendation } from '../mocks/mockSpaces';
import type { AiRecommendation, SpaceSummary } from '../types/api';
import { getSpaces } from './spaceService';

export interface FarmerRecommendation extends SpaceSummary {
  matchingScore: number;
  recommendedCrop: string;
  expectedProfit: number;
}

export async function getFarmerRecommendations(): Promise<FarmerRecommendation[]> {
  await mockDelay();
  const spaces = await getSpaces({ size: 6, sort: 'rent' });

  return spaces.content.map((space, index) => ({
    ...space,
    matchingScore: [94, 88, 82, 77][index] ?? 74,
    recommendedCrop:
      ['Butterhead Lettuce', 'Basil', 'Arugula', 'Bok Choy'][index] ?? 'Herbs',
    expectedProfit: [1160000, 780000, 920000, 690000][index] ?? 640000,
  }));
}

export async function runProfitPrediction(): Promise<AiRecommendation> {
  await mockDelay();
  return mockRecommendation;
}
