import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import { useNearbyItems } from '@/pages/market/hooks/useNearbyItems';
import type { MarketItem } from '@/types/api';

const geocodeAddress = vi.fn();
vi.mock('@/utils/geocode', async () => {
  const actual = await vi.importActual<typeof import('@/utils/geocode')>('@/utils/geocode');
  return { ...actual, geocodeAddress: (a: string) => geocodeAddress(a) };
});

// 폴백 지오코딩은 hasKakaoMapKey()가 true일 때만 동작한다. 앱키는 gitignore된 .env에서 오므로
// CI에는 키가 없어(hasKakaoMapKey=false) 폴백이 스킵된다 — 앰비언트 env에 의존하지 않도록 항상 true로 고정한다.
vi.mock('@/utils/kakaoSdk', async () => {
  const actual = await vi.importActual<typeof import('@/utils/kakaoSdk')>('@/utils/kakaoSdk');
  return { ...actual, hasKakaoMapKey: () => true };
});

function item(partial: Partial<MarketItem>): MarketItem {
  return {
    productId: 1,
    name: '상추',
    category: '잎채소',
    productionLocation: '장전',
    producerName: '농부',
    harvestDate: '2026-08-16',
    price: 4000,
    unit: '200g',
    imageUrl: null,
    freshnessTags: [],
    foodMileageKm: null,
    stock: 10,
    status: 'ON_SALE',
    address: null,
    latitude: null,
    longitude: null,
    ...partial,
  } as MarketItem;
}

const center = { lat: 35.1798, lng: 129.075 };

describe('useNearbyItems', () => {
  beforeEach(() => geocodeAddress.mockReset());

  it('저장된 좌표로 반경 내/외를 나눈다', async () => {
    const near = item({ productId: 1, latitude: 35.18, longitude: 129.076 });
    const far = item({ productId: 2, latitude: 35.4, longitude: 129.3 });
    const { result } = renderHook(() => useNearbyItems([near, far], center, 5));
    await waitFor(() => expect(result.current.mapItems).toHaveLength(1));
    expect(result.current.mapItems[0].item.productId).toBe(1);
    expect(result.current.visibleItems.map((i) => i.productId)).toEqual([1]);
  });

  it('좌표 없고 주소만 있으면 지오코딩 폴백', async () => {
    geocodeAddress.mockResolvedValue({ lat: 35.18, lng: 129.076 });
    const it1 = item({ productId: 3, address: '부산 어딘가' });
    const { result } = renderHook(() => useNearbyItems([it1], center, 5));
    await waitFor(() => expect(result.current.mapItems).toHaveLength(1));
    expect(geocodeAddress).toHaveBeenCalledWith('부산 어딘가');
  });

  it('좌표·주소 모두 없으면 그리드엔 남고 지도엔 없음', async () => {
    const noLoc = item({ productId: 4 });
    const { result } = renderHook(() => useNearbyItems([noLoc], center, 5));
    await waitFor(() =>
      expect(result.current.visibleItems.map((i) => i.productId)).toEqual([4]),
    );
    expect(result.current.mapItems).toHaveLength(0);
  });

  it('반경 내 아이템은 거리 오름차순 정렬', async () => {
    const nearA = item({ productId: 5, latitude: 35.2, longitude: 129.1 });
    const nearB = item({ productId: 6, latitude: 35.181, longitude: 129.076 });
    const { result } = renderHook(() => useNearbyItems([nearA, nearB], center, 10));
    await waitFor(() => expect(result.current.mapItems).toHaveLength(2));
    expect(result.current.visibleItems.map((i) => i.productId)).toEqual([6, 5]);
  });
});
