import { apiRequest, USE_MOCKS } from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
import { createMockPage, mockDelay } from '@/mocks/handlers';
import { mockRecommendation, mockSpaces } from '@/mocks/mockSpaces';
import type {
  AiRecommendation,
  PageResponse,
  SpaceCreateInput,
  SpaceDeleteResult,
  SpaceDetail,
  SpaceMutationResult,
  SpaceSearchParams,
  SpaceSummary,
  SpaceUpdateInput,
} from '@/types/api';

function buildSearchParams(params: SpaceSearchParams) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') searchParams.set(key, String(value));
  });

  return searchParams.toString();
}

function toSummary(space: SpaceDetail): SpaceSummary {
  // 목록 카드에는 상세 필드가 필요 없으므로 API 명세의 요약 DTO 형태로 잘라냅니다.
  const { spaceId, title, address, area, monthlyRent, status, imageUrl } = space;
  return { spaceId, title, address, area, monthlyRent, status, imageUrl };
}

function applySearch(spaces: SpaceDetail[], params: SpaceSearchParams = {}) {
  const keyword = params.keyword?.trim().toLowerCase();
  // 공개 목록은 삭제되지 않은 AVAILABLE 공간만 노출한다는 백엔드2 명세를 mock에도 반영합니다.
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
    const query = buildSearchParams(params);
    const response = await apiRequest<PageResponse<SpaceSummary>>(
      `${ENDPOINTS.spaces.list}${query ? `?${query}` : ''}`,
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
    return {
      ...response.data,
      imageUrl: response.data.imageUrls[0] ?? null,
    };
  }

  await mockDelay();
  const space = mockSpaces.find((item) => item.spaceId === spaceId);
  if (!space) {
    throw new Error('공간을 찾을 수 없습니다');
  }
  return space;
}

export async function getMySpaces(): Promise<SpaceSummary[]> {
  if (!USE_MOCKS) {
    const response = await apiRequest<SpaceSummary[]>(ENDPOINTS.spaces.my);
    return response.data;
  }

  await mockDelay();
  return mockSpaces.map(toSummary);
}

export async function createSpace(input: SpaceCreateInput): Promise<SpaceMutationResult> {
  if (!USE_MOCKS) {
    const response = await apiRequest<SpaceMutationResult>(ENDPOINTS.spaces.create, {
      method: 'POST',
      body: input,
    });
    return response.data;
  }

  await mockDelay();
  return {
    ...input,
    spaceId: 99,
    imageUrls: input.imageUrls ?? [],
    status: 'AVAILABLE',
    ownerId: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export async function updateSpace(
  spaceId: number,
  input: SpaceUpdateInput,
): Promise<SpaceMutationResult> {
  if (!USE_MOCKS) {
    const response = await apiRequest<SpaceMutationResult>(
      ENDPOINTS.spaces.detail(spaceId),
      { method: 'PATCH', body: input },
    );
    return response.data;
  }

  await mockDelay();
  const space = mockSpaces.find((item) => item.spaceId === spaceId);
  if (!space) throw new Error('공간을 찾을 수 없습니다');

  return {
    title: input.title ?? space.title,
    address: input.address ?? space.address,
    area: input.area ?? space.area,
    monthlyRent: input.monthlyRent ?? space.monthlyRent,
    floor: input.floor ?? space.floor,
    hasWater: input.hasWater ?? space.hasWater,
    hasElectricity: input.hasElectricity ?? space.hasElectricity,
    hasVentilation: input.hasVentilation ?? space.hasVentilation,
    description: input.description ?? space.description,
    imageUrls: input.imageUrls ?? space.imageUrls,
    spaceId,
    status: input.status ?? space.status,
    ownerId: space.owner.userId,
    createdAt: space.createdAt,
    updatedAt: new Date().toISOString(),
  };
}

export async function deleteSpace(spaceId: number): Promise<SpaceDeleteResult> {
  if (!USE_MOCKS) {
    const response = await apiRequest<SpaceDeleteResult>(
      ENDPOINTS.spaces.detail(spaceId),
      { method: 'DELETE' },
    );
    return response.data;
  }

  await mockDelay();
  return { spaceId, deleted: true };
}

export async function getRecommendation(spaceId: number): Promise<AiRecommendation> {
  if (!USE_MOCKS) {
    const response = await apiRequest<AiRecommendation>(ENDPOINTS.ai.recommend, {
      method: 'POST',
      body: { spaceId },
    });
    return response.data;
  }

  await mockDelay();
  return { ...mockRecommendation, spaceId };
}
