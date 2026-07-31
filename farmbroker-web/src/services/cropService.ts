import { apiRequest, USE_MOCKS } from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
import { mockDelay } from '@/mocks/handlers';
import { mockCrops } from '@/mocks/mockSpaces';
import type { CropDetail, CropSearchParams, CropSummary } from '@/types/api';

function buildQuery(params: CropSearchParams) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) searchParams.set(key, value);
  });
  return searchParams.toString();
}

export async function getCrops(params: CropSearchParams = {}): Promise<CropSummary[]> {
  if (!USE_MOCKS) {
    const query = buildQuery(params);
    const response = await apiRequest<CropSummary[]>(
      `${ENDPOINTS.crops.list}${query ? `?${query}` : ''}`,
    );
    return response.data;
  }

  await mockDelay();
  const keyword = params.keyword?.trim().toLowerCase();
  return mockCrops.filter(
    (crop) =>
      (!keyword || crop.name.toLowerCase().includes(keyword)) &&
      (!params.category || crop.category === params.category) &&
      (!params.difficulty || crop.difficulty === params.difficulty),
  );
}

export async function getCrop(cropId: number): Promise<CropDetail> {
  if (!USE_MOCKS) {
    const response = await apiRequest<CropDetail>(ENDPOINTS.crops.detail(cropId));
    return response.data;
  }

  await mockDelay();
  const crop = mockCrops.find((item) => item.cropId === cropId);
  if (!crop) throw new Error('작물을 찾을 수 없습니다');
  return crop;
}
