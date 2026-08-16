import { useEffect, useMemo, useState } from 'react';

import type { MarketItem } from '@/types/api';
import { type Coords, geocodeAddress, haversineKm } from '@/utils/geocode';
import { hasKakaoMapKey } from '@/utils/kakaoSdk';

export interface MapItem {
  item: MarketItem;
  coords: Coords;
  distanceKm: number;
}

interface NearbyResult {
  // 지도에 찍을 반경 내 상품(좌표 확정). 거리 오름차순.
  mapItems: MapItem[];
  // 그리드에 보일 상품 = 반경 내(거리순) + 좌표 없는 상품(뒤에). 좌표 있고 반경 밖은 제외.
  visibleItems: MarketItem[];
  // productId → 중심에서의 거리(km). 카드 거리 표시에 쓴다.
  distances: Map<number, number>;
}

function directCoords(item: MarketItem): Coords | null {
  if (item.latitude != null && item.longitude != null) {
    return { lat: item.latitude, lng: item.longitude };
  }
  return null;
}

export function useNearbyItems(
  items: MarketItem[],
  center: Coords,
  radiusKm: number,
): NearbyResult {
  // 폴백 지오코딩 결과: productId → 좌표. 저장 좌표가 있는 상품은 넣지 않는다.
  const [resolved, setResolved] = useState<Map<number, Coords>>(new Map());

  useEffect(() => {
    // 앱키가 없으면 지오코딩 자체가 실패(reject)하므로 폴백을 시도하지 않는다.
    if (!hasKakaoMapKey()) return;

    let cancelled = false;
    const missing = items.filter((it) => directCoords(it) === null && it.address);

    void Promise.all(
      missing.map(async (it) => {
        // 개별 실패가 Promise.all 전체를 무너뜨리지 않도록 항목마다 삼킨다.
        const coords = await geocodeAddress(it.address as string).catch(() => null);
        return coords ? ([it.productId, coords] as const) : null;
      }),
    ).then((entries) => {
      if (cancelled) return;
      setResolved((prev) => {
        const next = new Map(prev);
        for (const entry of entries) if (entry) next.set(entry[0], entry[1]);
        return next;
      });
    });

    return () => {
      cancelled = true;
    };
  }, [items]);

  return useMemo(() => {
    const mapItems: MapItem[] = [];
    const unlocated: MarketItem[] = [];

    for (const it of items) {
      const coords = directCoords(it) ?? resolved.get(it.productId) ?? null;
      if (!coords) {
        unlocated.push(it);
        continue;
      }
      const distanceKm = haversineKm(center, coords);
      if (distanceKm <= radiusKm) mapItems.push({ item: it, coords, distanceKm });
    }

    mapItems.sort((a, b) => a.distanceKm - b.distanceKm);
    const distances = new Map(mapItems.map((m) => [m.item.productId, m.distanceKm]));
    const visibleItems = [...mapItems.map((m) => m.item), ...unlocated];

    return { mapItems, visibleItems, distances };
  }, [items, center, radiusKm, resolved]);
}
