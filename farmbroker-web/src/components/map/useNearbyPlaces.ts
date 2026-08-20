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
  // 반경 검색 시 목록에 보일 항목 = 반경 내(거리순)만. "반경 km" 결과의 신뢰를 위해
  // 좌표를 확정하지 못한 항목(좌표·주소 없음 또는 지오코딩 실패/진행 중)은 넣지 않는다 —
  // 지도 마커 수와 목록 수가 일치한다. (앱키 없어 반경 개념이 없을 땐 페이지가 서버 목록을 그대로 쓴다.)
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
    // 로딩 중 빈 배열처럼 보완할 항목이 없을 때 상태를 새 Map으로 갱신하면
    // 새 items 배열 → effect → 상태 갱신 → 렌더가 반복되므로 아무 작업도 예약하지 않는다.
    if (missing.length === 0) return;

    void Promise.all(
      missing.map(async (it) => {
        // 개별 실패가 Promise.all 전체를 무너뜨리지 않도록 항목마다 삼킨다.
        const coords = await geocodeAddress(adapter.getAddress(it) as string).catch(() => null);
        return coords ? ([adapter.getId(it), coords] as const) : null;
      }),
    ).then((entries) => {
      if (cancelled) return;
      const foundEntries = entries.filter((entry) => entry !== null);
      if (foundEntries.length === 0) return;

      setResolved((prev) => {
        const next = new Map(prev);
        let changed = false;
        for (const [id, coords] of foundEntries) {
          const current = prev.get(id);
          if (current?.lat === coords.lat && current.lng === coords.lng) continue;
          next.set(id, coords);
          changed = true;
        }
        return changed ? next : prev;
      });
    });

    return () => {
      cancelled = true;
    };
  }, [items, adapter]);

  return useMemo(() => {
    const mapItems: NearbyMapItem<T>[] = [];

    for (const it of items) {
      const coords = adapter.getDirectCoords(it) ?? resolved.get(adapter.getId(it)) ?? null;
      // 위치를 확정하지 못한 항목은 "반경 km" 결과에 포함하지 않는다(반경 밖 취급).
      if (!coords) continue;
      const distanceKm = haversineKm(center, coords);
      if (distanceKm <= radiusKm) mapItems.push({ item: it, coords, distanceKm });
    }

    mapItems.sort((a, b) => a.distanceKm - b.distanceKm);
    const distances = new Map(mapItems.map((m) => [adapter.getId(m.item), m.distanceKm]));
    const visibleItems = mapItems.map((m) => m.item);

    return { mapItems, visibleItems, distances };
  }, [items, center, radiusKm, resolved, adapter]);
}
