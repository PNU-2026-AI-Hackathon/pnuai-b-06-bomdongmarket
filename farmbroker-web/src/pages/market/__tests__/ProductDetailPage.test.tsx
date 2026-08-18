import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ProductDetailPage } from '@/pages/market/ProductDetailPage';
import { getMarketItem } from '@/services/marketService';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { MarketItem } from '@/types/api';

vi.mock('@/services/marketService', () => ({
  getMarketItem: vi.fn(),
}));

function item(overrides: Partial<MarketItem> = {}): MarketItem {
  return {
    productId: 1,
    name: '버터헤드 상추',
    category: '잎채소',
    productionLocation: '장전 스마트팜',
    producerName: '어반리프',
    harvestDate: '2026-07-05',
    price: 4300,
    unit: '팩',
    imageUrl: null,
    freshnessTags: [],
    foodMileageKm: null,
    stock: 24,
    ...overrides,
  };
}

describe('ProductDetailPage 생산 이력', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 등록 폼에서 이력 입력을 뺐으므로, 이력이 없는 상품에 빈 카드가 남으면 안 된다.
  it('이력이 없으면 생산 이력 카드를 그리지 않는다', async () => {
    vi.mocked(getMarketItem).mockResolvedValue(item());

    renderWithProviders(<ProductDetailPage />, { route: '/market/1' });

    await screen.findByRole('heading', { name: '버터헤드 상추' });
    expect(screen.queryByRole('heading', { name: '생산 이력' })).not.toBeInTheDocument();
    expect(screen.queryByText('아직 등록된 생산 이력이 없습니다.')).not.toBeInTheDocument();
  });

  it('이력이 있으면 그대로 보여 준다', async () => {
    vi.mocked(getMarketItem).mockResolvedValue(
      item({
        traceabilityEvents: [
          { eventId: 1, stage: '파종', description: null, occurredAt: '2026-06-05', sortOrder: 0 },
        ],
      }),
    );

    renderWithProviders(<ProductDetailPage />, { route: '/market/1' });

    expect(await screen.findByRole('heading', { name: '생산 이력' })).toBeInTheDocument();
    expect(screen.getByText('파종')).toBeInTheDocument();
  });
});
