import { loadKakaoMaps } from '@/utils/kakaoSdk';

export interface Coords {
  lat: number;
  lng: number;
}

// 위/경도 두 점 사이의 대원거리(km). 반경 필터·거리정렬에 쓰는 순수 함수.
export function haversineKm(a: Coords, b: Coords): number {
  const R = 6371; // 지구 반지름(km)
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// 성공한 결과만 캐시한다(실패를 캐시하면 일시적 오류가 영구화됨).
const cache = new Map<string, Coords>();

/** 테스트 전용 — 캐시 초기화. */
export function __resetGeocodeCache() {
  cache.clear();
}

/** 주소 → 좌표. 실패 시 null. 성공 결과는 캐시한다. */
export async function geocodeAddress(address: string): Promise<Coords | null> {
  const key = address.trim();
  if (!key) return null;
  const cached = cache.get(key);
  if (cached) return cached;

  const maps = await loadKakaoMaps();
  return new Promise<Coords | null>((resolve) => {
    new maps.services.Geocoder().addressSearch(key, (results, status) => {
      const found = results[0];
      if (status !== maps.services.Status.OK || !found) {
        resolve(null);
        return;
      }
      // 지오코더는 x=경도, y=위도이며 문자열로 온다.
      const coords: Coords = { lat: Number(found.y), lng: Number(found.x) };
      cache.set(key, coords);
      resolve(coords);
    });
  });
}
