import { apiRequest, USE_MOCKS } from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
import { getStoredUser } from '@/auth/session';
import { mockDelay } from '@/mocks/handlers';
import { mockMarketItems } from '@/mocks/mockMarketItems';
import type { MarketItem, ProductInput } from '@/types/api';

export type ProductUpdateInput = Partial<ProductInput> & {
  removeImageUrl?: boolean;
  status?: 'ON_SALE' | 'CLOSED';
};

// 로컬마켓 상품 API.
// 조회(GET /products, /products/{id})에 이어 판매자용 등록·수정·삭제·내 상품 조회를 연결한다.
// 백엔드 계약: 인증 사용자 누구나 등록, category는 한글 라벨, '작업장에서 가져오기'는 GET /spaces/my 로 프리필.
//
// mock 모드에서는 등록·수정·삭제 결과가 목록/상세에도 보여야 데모가 끊기지 않으므로
// sessionStorage 저장소를 둔다(실서버 연동 시 아래 mock 블록은 불필요해진다).
export async function getMarketItems(
  params: {
    keyword?: string;
    category?: string;
  } = {},
): Promise<MarketItem[]> {
  if (USE_MOCKS) {
    await mockDelay();
    const keyword = params.keyword?.trim().toLowerCase();

    return mockStore.filter((item) => {
      // 검색어는 상품명과 생산 위치를 함께 보도록 해 소비자 탐색 흐름을 단순하게 만듭니다.
      const matchesKeyword = keyword
        ? item.name.toLowerCase().includes(keyword) ||
          item.productionLocation.toLowerCase().includes(keyword)
        : true;
      // 전체 카테고리는 필터를 적용하지 않는 특수값입니다.
      const matchesCategory =
        !params.category || params.category === '전체'
          ? true
          : item.category === params.category;

      return matchesKeyword && matchesCategory;
    });
  }

  const query = new URLSearchParams();
  if (params.keyword?.trim()) query.set('keyword', params.keyword.trim());
  // '전체'는 필터 미적용을 의미하므로 파라미터를 보내지 않습니다.
  if (params.category && params.category !== '전체') query.set('category', params.category);
  const queryString = query.toString();

  const response = await apiRequest<MarketItem[]>(
    `${ENDPOINTS.products.list}${queryString ? `?${queryString}` : ''}`,
  );
  return response.data;
}

export async function getMarketItem(productId: number): Promise<MarketItem> {
  if (USE_MOCKS) {
    await mockDelay();
    const item = mockStore.find((product) => product.productId === productId);
    if (!item) {
      throw new Error('상품을 찾을 수 없습니다');
    }
    // 시드 상품에는 이력이 없어 수확일 기준 샘플을 만들어 상세 타임라인을 채운다.
    return item.traceabilityEvents
      ? item
      : { ...item, traceabilityEvents: mockTraceability(item) };
  }

  const response = await apiRequest<MarketItem>(ENDPOINTS.products.detail(productId));
  return response.data;
}

// ── 판매자용 쓰기 API ──

const MOCK_STORE_KEY = 'farmbroker.mock.products';

function readMockStore(): MarketItem[] {
  if (typeof window === 'undefined') return [...mockMarketItems];
  try {
    const saved = window.sessionStorage.getItem(MOCK_STORE_KEY);
    return saved ? (JSON.parse(saved) as MarketItem[]) : [...mockMarketItems];
  } catch {
    return [...mockMarketItems];
  }
}

export function persistMockStore() {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(MOCK_STORE_KEY, JSON.stringify(mockStore));
  } catch {
    // 저장에 실패해도 이번 세션 메모리 값으로 계속 동작한다.
  }
}

// 찜 목업이 같은 재고를 보고 줄일 수 있도록 내보낸다(실서버에서는 쓰이지 않는다).
export const mockStore: MarketItem[] = readMockStore();

function toMockProduct(input: ProductInput, productId: number): MarketItem {
  return {
    productId,
    name: input.name,
    category: input.category,
    productionLocation: input.productionLocation,
    // 서버가 판매자 닉네임으로 고정하므로 목업도 로그인 사용자 닉네임을 그대로 씁니다.
    producerName: getStoredUser()?.nickname ?? '그린스페이스랩',
    harvestDate: input.harvestDate,
    price: input.price,
    unit: input.unit,
    imageUrl: input.imageUrl?.trim() || '',
    freshnessTags: ['이력 확인'],
    // 지도 연동(Task 3) 전이라 서버도 null을 내려준다.
    foodMileageKm: null,
    stock: input.stock,
    status: 'ON_SALE',
    sellerNickname: '그린스페이스랩',
    description: input.description ?? null,
    address: input.address ?? null,
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    spaceId: input.spaceId ?? null,
    createdAt: new Date().toISOString(),
    traceabilityEvents: (input.events ?? []).map((event, index) => ({
      eventId: index + 1,
      stage: event.stage,
      description: event.description ?? null,
      occurredAt: event.occurredAt,
      sortOrder: event.sortOrder ?? index,
    })),
  };
}

export async function getMyProducts(): Promise<MarketItem[]> {
  if (USE_MOCKS) {
    await mockDelay();
    // mock에는 판매자 구분이 없어 시드 2건과 이번 세션에 등록한 상품을 내 상품으로 취급한다.
    return mockStore.filter(
      (item, index) =>
        index < 2 || !mockMarketItems.some((seed) => seed.productId === item.productId),
    );
  }

  const response = await apiRequest<MarketItem[]>(ENDPOINTS.products.my);
  return response.data;
}

export async function createProduct(input: ProductInput): Promise<MarketItem> {
  if (USE_MOCKS) {
    await mockDelay();
    const created = toMockProduct(input, Date.now());
    mockStore.unshift(created);
    persistMockStore();
    return created;
  }

  const response = await apiRequest<MarketItem>(ENDPOINTS.products.create, {
    method: 'POST',
    body: input,
  });
  return response.data;
}

export async function updateProduct(
  productId: number,
  input: ProductUpdateInput,
): Promise<MarketItem> {
  if (USE_MOCKS) {
    await mockDelay();
    const index = mockStore.findIndex((product) => product.productId === productId);
    if (index === -1) throw new Error('상품을 찾을 수 없습니다');
    const current = mockStore[index]!;
    const { events, removeImageUrl, ...patch } = input;
    const updated: MarketItem = {
      ...current,
      ...patch,
      imageUrl: removeImageUrl ? null : (input.imageUrl ?? current.imageUrl),
      traceabilityEvents: events
        ? events.map((event, eventIndex) => ({
            eventId: eventIndex + 1,
            stage: event.stage,
            description: event.description ?? null,
            occurredAt: event.occurredAt,
            sortOrder: event.sortOrder ?? eventIndex,
          }))
        : current.traceabilityEvents,
    };
    mockStore[index] = updated;
    persistMockStore();
    return updated;
  }

  const response = await apiRequest<MarketItem>(ENDPOINTS.products.detail(productId), {
    method: 'PATCH',
    body: input,
  });
  return response.data;
}

// 백엔드는 소프트 삭제라 목록에서만 사라지고 데이터는 남는다.
export async function deleteProduct(productId: number): Promise<void> {
  if (USE_MOCKS) {
    await mockDelay();
    const index = mockStore.findIndex((product) => product.productId === productId);
    if (index !== -1) {
      mockStore.splice(index, 1);
      persistMockStore();
    }
    return;
  }

  await apiRequest<void>(ENDPOINTS.products.detail(productId), { method: 'DELETE' });
}

// 시드 mock 상품용 생산 이력 샘플(실서버에서는 서버가 내려준다).
function mockTraceability(item: MarketItem) {
  const shift = (days: number) => {
    const date = new Date(item.harvestDate);
    date.setDate(date.getDate() + days);
    return date.toISOString().slice(0, 10);
  };
  return [
    { eventId: 1, stage: '파종', description: '육묘 트레이에 파종', occurredAt: shift(-30), sortOrder: 0 },
    { eventId: 2, stage: '생육 관리', description: '양액·조명 주기 관리', occurredAt: shift(-14), sortOrder: 1 },
    { eventId: 3, stage: '수확', description: '당일 수확 후 예냉', occurredAt: shift(0), sortOrder: 2 },
    { eventId: 4, stage: '마켓 등록', description: '로컬마켓에 등록', occurredAt: shift(0), sortOrder: 3 },
  ];
}
