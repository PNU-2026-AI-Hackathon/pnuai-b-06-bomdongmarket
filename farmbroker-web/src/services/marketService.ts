import { mockDelay } from '@/mocks/handlers';
import { mockMarketItems } from '@/mocks/mockMarketItems';
import type { MarketItem } from '@/types/api';

export async function getMarketItems(
  params: {
    keyword?: string;
    category?: string;
  } = {},
): Promise<MarketItem[]> {
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

export async function getMarketItem(productId: number): Promise<MarketItem> {
  await mockDelay();
  const item = mockMarketItems.find((product) => product.productId === productId);
  if (!item) {
    throw new Error('상품을 찾을 수 없습니다');
  }
  return item;
}
