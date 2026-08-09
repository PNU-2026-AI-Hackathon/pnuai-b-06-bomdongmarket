import { apiRequest, USE_MOCKS } from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
import { mockDelay } from '@/mocks/handlers';
import { mockMarketItems } from '@/mocks/mockMarketItems';
import type { MarketItem } from '@/types/api';

// 조회 API(GET /products, GET /products/{id})만 연결한다.
// 상품 등록/수정/삭제(POST·PATCH·DELETE /products) UI는 이 백엔드 계약을 기준으로 추후 다른 인원이 구현한다.
// (백엔드: 인증 사용자 누구나 등록, category는 한글 라벨, '작업장에서 가져오기'는 GET /spaces/my 로 프리필)
export async function getMarketItems(
  params: {
    keyword?: string;
    category?: string;
  } = {},
): Promise<MarketItem[]> {
  if (USE_MOCKS) {
    await mockDelay();
    const keyword = params.keyword?.trim().toLowerCase();

    return mockMarketItems.filter((item) => {
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
    const item = mockMarketItems.find((product) => product.productId === productId);
    if (!item) {
      throw new Error('상품을 찾을 수 없습니다');
    }
    return item;
  }

  const response = await apiRequest<MarketItem>(ENDPOINTS.products.detail(productId));
  return response.data;
}
