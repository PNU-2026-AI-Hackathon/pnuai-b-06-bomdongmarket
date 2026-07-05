import { apiRequest, USE_MOCKS } from '../api/client';
import { ENDPOINTS } from '../api/endpoints';
import { createMockPage, mockDelay } from '../mocks/handlers';
import { mockRecommendation, mockSpaces } from '../mocks/mockSpaces';
import type {
  AiRecommendation,
  PageResponse,
  SpaceCreateInput,
  SpaceDetail,
  SpaceSearchParams,
  SpaceSummary,
} from '../types/api';

function toSummary(space: SpaceDetail): SpaceSummary {
  const { spaceId, title, address, area, monthlyRent, status, imageUrl } = space;
  return { spaceId, title, address, area, monthlyRent, status, imageUrl };
}

function applySearch(spaces: SpaceDetail[], params: SpaceSearchParams = {}) {
  const keyword = params.keyword?.trim().toLowerCase();
  let result = spaces.filter((space) => space.status === 'AVAILABLE');

  if (keyword) {
    result = result.filter(
      (space) =>
        space.title.toLowerCase().includes(keyword) ||
        space.address.toLowerCase().includes(keyword),
    );
  }

  if (params.minArea) {
    result = result.filter((space) => space.area >= Number(params.minArea));
  }

  if (params.maxRent) {
    result = result.filter((space) => space.monthlyRent <= Number(params.maxRent));
  }

  if (params.sort === 'area') {
    result = [...result].sort((a, b) => b.area - a.area);
  } else if (params.sort === 'rent') {
    result = [...result].sort((a, b) => a.monthlyRent - b.monthlyRent);
  } else {
    result = [...result].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  return result;
}

export async function getSpaces(
  params: SpaceSearchParams = {},
): Promise<PageResponse<SpaceSummary>> {
  if (!USE_MOCKS) {
    const response = await apiRequest<PageResponse<SpaceSummary>>(
      `${ENDPOINTS.spaces.list}?${new URLSearchParams(params as Record<string, string>)}`,
    );
    return response.data;
  }

  await mockDelay();
  const filtered = applySearch(mockSpaces, params).map(toSummary);
  return createMockPage(filtered, params.page ?? 0, params.size ?? 10);
}

export async function getSpaceDetail(spaceId: number): Promise<SpaceDetail> {
  if (!USE_MOCKS) {
    const response = await apiRequest<SpaceDetail>(ENDPOINTS.spaces.detail(spaceId));
    return response.data;
  }

  await mockDelay();
  const space = mockSpaces.find((item) => item.spaceId === spaceId);
  if (!space) {
    throw new Error('Space not found');
  }
  return space;
}

export async function getMySpaces(): Promise<SpaceSummary[]> {
  await mockDelay();
  return mockSpaces.map(toSummary);
}

export async function createSpace(input: SpaceCreateInput): Promise<SpaceDetail> {
  await mockDelay();
  return {
    ...mockSpaces[0],
    ...input,
    spaceId: 99,
    imageUrl: input.imageUrls?.[0] ?? mockSpaces[0].imageUrl,
    imageUrls: input.imageUrls ?? [],
    status: 'AVAILABLE',
    owner: { userId: 1, nickname: 'Demo Owner' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export async function getRecommendation(spaceId: number): Promise<AiRecommendation> {
  await mockDelay();
  return { ...mockRecommendation, spaceId };
}
