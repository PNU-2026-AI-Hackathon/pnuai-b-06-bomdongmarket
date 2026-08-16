import { useEffect, useMemo, useState } from 'react';

import { type Coords, geocodeAddress, haversineKm } from '@/utils/geocode';
import { hasKakaoMapKey } from '@/utils/kakaoSdk';

export interface NearbyAdapter<T> {
  getId: (item: T) => number;
  getDirectCoords: (item: T) => Coords | null;
  getAddress: (item: T) => string | null;
}

export interface NearbyMapItem<T> {
  item: T;
  coords: Coords;
  distanceKm: number;
}

interface NearbyResult<T> {
  // 지도에 찍을 반경 내 항목(좌표 확정). 거리 오름차순.
  mapItems: NearbyMapItem<T>[];
  // 그리드에 보일 항목 = 반경 내(거리순) + 좌표 없는 항목(뒤에). 좌표 있고 반경 밖은 제외.
  visibleItems: T[];
  // id → 중심에서의 거리(km). 카드 거리 표시에 쓴다.
  distances: Map<number, number>;
}

export function useNearbyPlaces<T>(
  items: T[],
  center: Coords,
  radiusKm: number,
  adapter: NearbyAdapter<T>,
): NearbyResult<T> {
  // 폴백 지오코딩 결과: id → 좌표. 저장 좌표가 있는 항목은 넣지 않는다.
  const [resolved, setResolved] = useState<Map<number, Coords>>(new Map());

  useEffect(() => {
    // 앱키가 없으면 지오코딩 자체가 실패(reject)하므로 폴백을 시도하지 않는다.
    if (!hasKakaoMapKey()) return;

    let cancelled = false;
    const missing = items.filter(
      (it) => adapter.getDirectCoords(it) === null && adapter.getAddress(it),
    );

    void Promise.all(
      missing.map(async (it) => {
        // 개별 실패가 Promise.all 전체를 무너뜨리지 않도록 항목마다 삼킨다.
        const coords = await geocodeAddress(adapter.getAddress(it) as string).catch(() => null);
        return coords ? ([adapter.getId(it), coords] as const) : null;
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
  }, [items, adapter]);

  return useMemo(() => {
    const mapItems: NearbyMapItem<T>[] = [];
    const unlocated: T[] = [];

    for (const it of items) {
      const coords = adapter.getDirectCoords(it) ?? resolved.get(adapter.getId(it)) ?? null;
      if (!coords) {
        unlocated.push(it);
        continue;
      }
      const distanceKm = haversineKm(center, coords);
      if (distanceKm <= radiusKm) mapItems.push({ item: it, coords, distanceKm });
    }

    mapItems.sort((a, b) => a.distanceKm - b.distanceKm);
    const distances = new Map(mapItems.map((m) => [adapter.getId(m.item), m.distanceKm]));
    const visibleItems = [...mapItems.map((m) => m.item), ...unlocated];

    return { mapItems, visibleItems, distances };
  }, [items, center, radiusKm, resolved, adapter]);
}
