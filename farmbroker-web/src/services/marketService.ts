import { mockDelay } from '../mocks/handlers';
import { mockMarketItems } from '../mocks/mockMarketItems';
import type { MarketItem } from '../types/api';

export async function getMarketItems(
  params: {
    keyword?: string;
    category?: string;
  } = {},
): Promise<MarketItem[]> {
  await mockDelay();
  const keyword = params.keyword?.trim().toLowerCase();

  return mockMarketItems.filter((item) => {
    const matchesKeyword = keyword
      ? item.name.toLowerCase().includes(keyword) ||
        item.productionLocation.toLowerCase().includes(keyword)
      : true;
    const matchesCategory =
      !params.category || params.category === 'All'
        ? true
        : item.category === params.category;

    return matchesKeyword && matchesCategory;
  });
}

export async function getMarketItem(productId: number): Promise<MarketItem> {
  await mockDelay();
  const item = mockMarketItems.find((product) => product.productId === productId);
  if (!item) {
    throw new Error('Product not found');
  }
  return item;
}
