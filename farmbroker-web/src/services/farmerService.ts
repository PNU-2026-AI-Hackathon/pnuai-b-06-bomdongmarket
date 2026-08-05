import type { SpaceSummary } from '@/types/api';
import { getSpaces } from '@/services/spaceService';

export type FarmerRecommendation = SpaceSummary;

export async function getFarmerRecommendations(): Promise<FarmerRecommendation[]> {
  const spaces = await getSpaces({ size: 6, sort: 'rent' });
  return spaces.content;
}
