# 로컬마켓 지도 검색 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 로컬마켓에 주소 입력 + 반경(km) 기반 지도 검색을 추가해, 주변에서 판매 중인 상품을 지도 마커로 보여주고 클릭 시 정보를 띄운다.

**Architecture:** 하이브리드 좌표 전략 — 상품 등록 시 프론트가 카카오로 주소를 지오코딩해 lat/lng를 저장하고, 조회 시 서버가 목록에 lat/lng/address를 내려준다. 반경 필터는 프론트에서 haversine으로 계산한다. 좌표가 없는 레거시 상품은 조회 시 주소로 즉석 지오코딩(캐시)한다. UI는 상단 지도 + 하단 그리드가 같은 반경 결과를 공유한다. 마커 클릭은 카카오 오버레이 대신 React 상태로 처리해 테스트 가능성을 확보한다.

**Tech Stack:** React 19 + TypeScript + Vite, Vitest + Testing Library, 카카오 지도 SDK(services 지오코딩), Spring Boot(Java 21) — 목록 DTO 1건.

**Spec:** `docs/specs/2026-08-16-market-map-search-design.md`

> **커밋 규칙:** 커밋 메시지에 `Co-Authored-By` 라인을 넣지 않는다. `push`/PR은 사용자가 직접 하므로, 이 플랜의 각 커밋 이후 push하지 않는다.

> **테스트 실행 주의:** 한글 경로에서 `npm test`는 정상 동작(vitest는 fileURLToPath로 해결됨). 백엔드 `gradlew test`는 한글 경로에서 ClassNotFoundException으로 실패하므로, 백엔드는 **컴파일(`gradlew compileJava`)까지만 로컬 확인**하고 테스트는 CI에 맡긴다.

---

## File Structure

**백엔드 (수정 1):**
- `farmbroker/src/main/java/com/farmbroker/farmbroker/product/dto/ProductListItemResponse.java` — `latitude/longitude/address` 3필드 추가

**프론트 신규:**
- `farmbroker-web/src/utils/geocode.ts` — `haversineKm`(순수), `geocodeAddress`(카카오 래핑 + 캐시)
- `farmbroker-web/src/utils/__tests__/geocode.test.ts`
- `farmbroker-web/src/pages/market/hooks/useNearbyItems.ts` — 좌표 해석 + 반경 필터·거리정렬
- `farmbroker-web/src/pages/market/hooks/__tests__/useNearbyItems.test.tsx`
- `farmbroker-web/src/pages/market/components/MarketMap.tsx` — 다중 마커 + 반경 원 + 마커 클릭 콜백
- `farmbroker-web/src/pages/market/components/__tests__/MarketMap.test.tsx`
- `farmbroker-web/src/pages/market/components/MarketMapSearch.tsx` — 주소 검색 + 반경 셀렉터

**프론트 수정:**
- `farmbroker-web/src/types/kakao.d.ts` — `Circle`, `event.addListener`, `Map.setLevel` 타입 추가
- `farmbroker-web/src/test/kakaoSdkMock.ts` — 지도 활성 mock(`createKakaoMapMock`) 추가
- `farmbroker-web/src/pages/market/MarketPage.tsx` — 지도 검색 통합, 정적 카드 대체
- `farmbroker-web/src/pages/market/ProductFormPage.tsx` — 제출 전 주소 지오코딩 → 좌표 payload 포함
- `farmbroker-web/src/services/marketService.ts` — mock `toMockProduct` 좌표 반영
- `farmbroker-web/src/constants/geo.ts` (신규 소형 상수) — 부산 기본 중심/반경

---

## Task 1: 백엔드 목록 응답에 좌표·주소 추가

**Files:**
- Modify: `farmbroker/src/main/java/com/farmbroker/farmbroker/product/dto/ProductListItemResponse.java`

배경: `ProductCreateRequest`/`ProductService`는 이미 `latitude/longitude/address`를 저장한다. 목록 DTO만 이를 노출하지 않아 지도가 좌표를 못 받는다. 상세(`ProductDetailResponse`)엔 이미 있다.

- [ ] **Step 1: DTO에 필드 3개 추가**

`ProductListItemResponse.java`의 필드 목록에 추가(선언):

```java
    private final String status;
    private final List<String> freshnessTags;
    // 지도 검색용 — 등록 시 저장된 좌표/주소(없으면 프론트가 주소로 지오코딩 폴백)
    private final Double latitude;
    private final Double longitude;
    private final String address;
```

생성자 매핑에 추가(`this.freshnessTags = freshnessTags;` 다음):

```java
        this.freshnessTags = freshnessTags;
        this.latitude = product.getLatitude();
        this.longitude = product.getLongitude();
        this.address = product.getAddress();
```

- [ ] **Step 2: 컴파일 확인** (한글 경로 gradle test 회피 — 컴파일만)

Run: `cd farmbroker && ./gradlew compileJava -q`
Expected: BUILD SUCCESSFUL (에러 없음)

- [ ] **Step 3: 커밋**

```bash
git add farmbroker/src/main/java/com/farmbroker/farmbroker/product/dto/ProductListItemResponse.java
git commit -m "feat(product): 목록 응답에 latitude/longitude/address 추가

지도 검색이 목록만으로 마커를 그릴 수 있도록 좌표·주소를 노출한다.
등록 API와 서비스는 이미 좌표를 저장하고 있어 DTO 매핑만 추가한다."
```

---

## Task 2: 지오코딩·거리 유틸

**Files:**
- Create: `farmbroker-web/src/utils/geocode.ts`
- Test: `farmbroker-web/src/utils/__tests__/geocode.test.ts`

`SpaceLocationMap`이 인라인으로 하던 지오코딩을 재사용 가능한 함수로 뽑고, 결과를 캐시한다. haversine은 순수 함수.

- [ ] **Step 1: 실패 테스트 작성**

`geocode.test.ts`:

```ts
import { describe, expect, it, vi, beforeEach } from 'vitest';

import { haversineKm, geocodeAddress, __resetGeocodeCache } from '@/utils/geocode';

describe('haversineKm', () => {
  it('부산시청 ↔ 해운대 거리를 근사한다(약 11km)', () => {
    const busanCityHall = { lat: 35.1798, lng: 129.075 };
    const haeundae = { lat: 35.1587, lng: 129.1604 };
    const d = haversineKm(busanCityHall, haeundae);
    expect(d).toBeGreaterThan(7);
    expect(d).toBeLessThan(10);
  });

  it('같은 좌표는 0', () => {
    const p = { lat: 35.1, lng: 129.0 };
    expect(haversineKm(p, p)).toBeCloseTo(0, 5);
  });
});

// 지도 SDK 로더를 대체해 지오코더가 정해진 좌표를 돌려주도록 한다.
const addressSearch = vi.fn();
vi.mock('@/utils/kakaoSdk', () => ({
  loadKakaoMaps: () =>
    Promise.resolve({
      services: {
        Geocoder: class {
          addressSearch = addressSearch;
        },
        Status: { OK: 'OK', ZERO_RESULT: 'ZERO_RESULT', ERROR: 'ERROR' },
      },
    }),
}));

describe('geocodeAddress', () => {
  beforeEach(() => {
    __resetGeocodeCache();
    addressSearch.mockReset();
  });

  it('주소를 좌표로 변환한다(x=lng, y=lat)', async () => {
    addressSearch.mockImplementation((_addr: string, cb: (r: unknown[], s: string) => void) =>
      cb([{ x: '129.075', y: '35.1798', address_name: '부산' }], 'OK'),
    );
    const coords = await geocodeAddress('부산광역시청');
    expect(coords).toEqual({ lat: 35.1798, lng: 129.075 });
  });

  it('같은 주소는 캐시로 재요청하지 않는다', async () => {
    addressSearch.mockImplementation((_addr: string, cb: (r: unknown[], s: string) => void) =>
      cb([{ x: '129.075', y: '35.1798', address_name: '부산' }], 'OK'),
    );
    await geocodeAddress('부산광역시청');
    await geocodeAddress('부산광역시청');
    expect(addressSearch).toHaveBeenCalledTimes(1);
  });

  it('결과가 없으면 null(실패는 캐시하지 않음)', async () => {
    addressSearch.mockImplementation((_addr: string, cb: (r: unknown[], s: string) => void) =>
      cb([], 'ZERO_RESULT'),
    );
    expect(await geocodeAddress('없는주소')).toBeNull();
    await geocodeAddress('없는주소');
    expect(addressSearch).toHaveBeenCalledTimes(2);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `cd farmbroker-web && npx vitest run src/utils/__tests__/geocode.test.ts`
Expected: FAIL (`geocode` 모듈 없음)

- [ ] **Step 3: 최소 구현**

`geocode.ts`:

```ts
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
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `cd farmbroker-web && npx vitest run src/utils/__tests__/geocode.test.ts`
Expected: PASS (5개)

- [ ] **Step 5: 커밋**

```bash
git add farmbroker-web/src/utils/geocode.ts farmbroker-web/src/utils/__tests__/geocode.test.ts
git commit -m "feat(web): 지오코딩·haversine 유틸 추가

주소→좌표 변환(성공만 캐시)과 두 좌표 거리 계산을 재사용 유틸로 분리.
지도 검색의 반경 필터·거리정렬 기반이 된다."
```

---

## Task 3: 기본 중심 상수 + 좌표 해석·반경 필터 훅

**Files:**
- Create: `farmbroker-web/src/constants/geo.ts`
- Create: `farmbroker-web/src/pages/market/hooks/useNearbyItems.ts`
- Test: `farmbroker-web/src/pages/market/hooks/__tests__/useNearbyItems.test.tsx`

훅은 아이템의 좌표를 해석(저장값 우선, 없으면 주소로 폴백 지오코딩)하고, 중심/반경으로 나눈다.

- [ ] **Step 1: 기본 상수 작성**

`constants/geo.ts`:

```ts
import type { Coords } from '@/utils/geocode';

// 지도 검색 진입 시 기본 중심 — 부산시청. 사용자가 주소를 검색하면 갱신된다.
export const DEFAULT_MAP_CENTER: Coords = { lat: 35.1798, lng: 129.075 };

// 반경 셀렉터 옵션(km)과 기본값.
export const RADIUS_OPTIONS_KM = [1, 3, 5, 10] as const;
export const DEFAULT_RADIUS_KM = 5;
```

- [ ] **Step 2: 실패 테스트 작성**

`useNearbyItems.test.tsx`:

```tsx
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import { useNearbyItems } from '@/pages/market/hooks/useNearbyItems';
import type { MarketItem } from '@/types/api';

const geocodeAddress = vi.fn();
vi.mock('@/utils/geocode', async () => {
  const actual = await vi.importActual<typeof import('@/utils/geocode')>('@/utils/geocode');
  return { ...actual, geocodeAddress: (a: string) => geocodeAddress(a) };
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
    const near = item({ productId: 1, latitude: 35.18, longitude: 129.076 }); // ~0.1km
    const far = item({ productId: 2, latitude: 35.4, longitude: 129.3 }); // ~30km+
    const { result } = renderHook(() => useNearbyItems([near, far], center, 5));
    await waitFor(() => expect(result.current.mapItems).toHaveLength(1));
    expect(result.current.mapItems[0].item.productId).toBe(1);
    // 그리드에는 반경 내 + 좌표없음만. far(좌표 있고 반경 밖)는 제외.
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
    const nearA = item({ productId: 5, latitude: 35.2, longitude: 129.1 }); // 더 멂
    const nearB = item({ productId: 6, latitude: 35.181, longitude: 129.076 }); // 더 가까움
    const { result } = renderHook(() => useNearbyItems([nearA, nearB], center, 10));
    await waitFor(() => expect(result.current.mapItems).toHaveLength(2));
    expect(result.current.visibleItems.map((i) => i.productId)).toEqual([6, 5]);
  });
});
```

- [ ] **Step 3: 테스트 실패 확인**

Run: `cd farmbroker-web && npx vitest run src/pages/market/hooks/__tests__/useNearbyItems.test.tsx`
Expected: FAIL (`useNearbyItems` 없음)

- [ ] **Step 4: 최소 구현**

`useNearbyItems.ts`:

```ts
import { useEffect, useMemo, useState } from 'react';

import type { MarketItem } from '@/types/api';
import { type Coords, geocodeAddress, haversineKm } from '@/utils/geocode';

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
    let cancelled = false;
    const missing = items.filter((it) => directCoords(it) === null && it.address);

    void Promise.all(
      missing.map(async (it) => {
        const coords = await geocodeAddress(it.address as string);
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
      // 좌표 있고 반경 밖이면 지도·그리드 모두에서 빠진다.
    }

    mapItems.sort((a, b) => a.distanceKm - b.distanceKm);
    const distances = new Map(mapItems.map((m) => [m.item.productId, m.distanceKm]));
    const visibleItems = [...mapItems.map((m) => m.item), ...unlocated];

    return { mapItems, visibleItems, distances };
  }, [items, center, radiusKm, resolved]);
}
```

- [ ] **Step 5: 테스트 통과 확인**

Run: `cd farmbroker-web && npx vitest run src/pages/market/hooks/__tests__/useNearbyItems.test.tsx`
Expected: PASS (4개)

- [ ] **Step 6: 커밋**

```bash
git add farmbroker-web/src/constants/geo.ts farmbroker-web/src/pages/market/hooks/useNearbyItems.ts farmbroker-web/src/pages/market/hooks/__tests__/useNearbyItems.test.tsx
git commit -m "feat(web): 상품 좌표 해석·반경 필터 훅 추가

저장 좌표 우선, 없으면 주소로 폴백 지오코딩. 중심/반경으로 지도·그리드
집합을 나누고 거리 오름차순 정렬한다. 좌표 없는 상품은 그리드에만 남긴다."
```

---

## Task 4: 카카오 타입 확장 + 지도 활성 테스트 mock

**Files:**
- Modify: `farmbroker-web/src/types/kakao.d.ts`
- Modify: `farmbroker-web/src/test/kakaoSdkMock.ts`

MarketMap이 쓸 `Circle`·마커 클릭 이벤트·`setLevel` 타입을 좁게 추가하고, 지도를 활성 상태로 두는 테스트 mock을 만든다.

- [ ] **Step 1: 타입 확장**

`kakao.d.ts`의 `KakaoMap`에 추가:

```ts
interface KakaoMap {
  setCenter: (position: KakaoLatLng) => void;
  setLevel: (level: number) => void;
  relayout: () => void;
}
```

`KakaoMarker` 아래에 원·이벤트 타입 추가, `KakaoMaps`에 `Circle`·`event` 추가:

```ts
interface KakaoCircle {
  setMap: (map: KakaoMap | null) => void;
  setPosition: (position: KakaoLatLng) => void;
  setRadius: (meters: number) => void;
}

interface KakaoMaps {
  load: (callback: () => void) => void;
  LatLng: new (latitude: number, longitude: number) => KakaoLatLng;
  Map: new (
    container: HTMLElement,
    options: { center: KakaoLatLng; level: number },
  ) => KakaoMap;
  Marker: new (options: { map?: KakaoMap; position: KakaoLatLng; title?: string }) => KakaoMarker;
  Circle: new (options: {
    center: KakaoLatLng;
    radius: number;
    strokeWeight?: number;
    strokeColor?: string;
    strokeOpacity?: number;
    fillColor?: string;
    fillOpacity?: number;
  }) => KakaoCircle;
  event: {
    addListener: (target: object, type: string, handler: () => void) => void;
  };
  services: {
    Geocoder: new () => KakaoGeocoder;
    Status: { OK: string; ZERO_RESULT: string; ERROR: string };
  };
}
```

- [ ] **Step 2: 지도 활성 mock 추가**

`kakaoSdkMock.ts` 맨 아래에 추가(기존 `createKakaoSdkMock`은 그대로 둔다 — 우편번호 화면용):

```ts
// 지도 마커/원을 만드는 화면(MarketMap) 테스트용. 생성된 마커 수 등을 관찰할 수 있게
// 간단한 가짜 maps 네임스페이스를 돌려준다. hasKakaoMapKey는 true.
export function createKakaoMapMock() {
  const markers: Array<{ position: unknown; handlers: Record<string, () => void> }> = [];

  const maps = {
    load: (cb: () => void) => cb(),
    LatLng: class {
      constructor(
        public lat: number,
        public lng: number,
      ) {}
      getLat() {
        return this.lat;
      }
      getLng() {
        return this.lng;
      }
    },
    Map: class {
      setCenter() {}
      setLevel() {}
      relayout() {}
    },
    Marker: class {
      handlers: Record<string, () => void> = {};
      constructor(public options: { position: unknown }) {
        markers.push({ position: options.position, handlers: this.handlers });
      }
      setPosition() {}
      setMap() {}
    },
    Circle: class {
      setMap() {}
      setPosition() {}
      setRadius() {}
    },
    event: {
      addListener: (target: { handlers?: Record<string, () => void> }, type: string, handler: () => void) => {
        if (target.handlers) target.handlers[type] = handler;
      },
    },
    services: {
      Geocoder: class {
        addressSearch(_a: string, cb: (r: unknown[], s: string) => void) {
          cb([{ x: '129.075', y: '35.1798', address_name: '부산' }], 'OK');
        }
      },
      Status: { OK: 'OK', ZERO_RESULT: 'ZERO_RESULT', ERROR: 'ERROR' },
    },
  };

  return {
    markers,
    module: {
      hasKakaoMapKey: () => true,
      loadKakaoMaps: () => Promise.resolve(maps as unknown as KakaoMaps),
      loadPostcodeScript: () => Promise.reject(new Error('이 mock은 지도만 담당합니다.')),
    },
  };
}
```

- [ ] **Step 3: 타입 체크 통과 확인**

Run: `cd farmbroker-web && npx tsc --noEmit`
Expected: 새 파일 관련 에러 없음(아직 MarketMap 미작성이므로 mock 자체는 사용처가 다음 태스크)

- [ ] **Step 4: 커밋**

```bash
git add farmbroker-web/src/types/kakao.d.ts farmbroker-web/src/test/kakaoSdkMock.ts
git commit -m "chore(web): 카카오 지도 타입에 Circle·이벤트 추가 + 지도 mock

MarketMap이 쓸 반경 원과 마커 클릭 이벤트 타입을 좁게 선언하고,
마커 생성을 관찰할 수 있는 지도 활성 테스트 mock을 추가한다."
```

---

## Task 5: MarketMap 컴포넌트 (다중 마커 + 반경 원 + 클릭)

**Files:**
- Create: `farmbroker-web/src/pages/market/components/MarketMap.tsx`
- Test: `farmbroker-web/src/pages/market/components/__tests__/MarketMap.test.tsx`

`SpaceLocationMap`의 로더·로딩/에러·`cancelled` 가드 패턴을 따르되, 마커를 여러 개 그리고 반경 원을 얹는다. 마커 클릭은 카카오 오버레이 대신 `onSelect(productId)` 콜백으로 올린다(테스트·React 상태 친화적).

- [ ] **Step 1: 실패 테스트 작성**

`MarketMap.test.tsx`:

```tsx
import { render, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { createKakaoMapMock } from '@/test/kakaoSdkMock';

const mapMock = createKakaoMapMock();
vi.mock('@/utils/kakaoSdk', () => mapMock.module);

// mock 이후에 import(호이스팅 회피)
import { MarketMap } from '@/pages/market/components/MarketMap';
import type { MapItem } from '@/pages/market/hooks/useNearbyItems';

function mapItem(productId: number): MapItem {
  return {
    item: { productId, name: `상품${productId}` } as never,
    coords: { lat: 35.18, lng: 129.076 },
    distanceKm: 0.5,
  };
}

describe('MarketMap', () => {
  it('반경 내 아이템 수만큼 마커를 만든다', async () => {
    mapMock.markers.length = 0;
    render(
      <MarketMap
        center={{ lat: 35.1798, lng: 129.075 }}
        radiusKm={5}
        items={[mapItem(1), mapItem(2)]}
        selectedId={null}
        onSelect={() => {}}
      />,
    );
    await waitFor(() => expect(mapMock.markers).toHaveLength(2));
  });

  it('마커 클릭 시 onSelect를 productId로 부른다', async () => {
    mapMock.markers.length = 0;
    const onSelect = vi.fn();
    render(
      <MarketMap
        center={{ lat: 35.1798, lng: 129.075 }}
        radiusKm={5}
        items={[mapItem(7)]}
        selectedId={null}
        onSelect={onSelect}
      />,
    );
    await waitFor(() => expect(mapMock.markers).toHaveLength(1));
    mapMock.markers[0].handlers.click?.();
    expect(onSelect).toHaveBeenCalledWith(7);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `cd farmbroker-web && npx vitest run src/pages/market/components/__tests__/MarketMap.test.tsx`
Expected: FAIL (`MarketMap` 없음)

- [ ] **Step 3: 구현**

`MarketMap.tsx` — 핵심 로직(요지):
- `useEffect`로 `loadKakaoMaps()` → 성공 시 `status='ready'`. 실패/키없음 처리.
- 지도 인스턴스는 `mapRef`로 1회 생성, 이후 `center` 변경 시 `setCenter`만.
- `items`/`center`/`radiusKm` 변경 시: 기존 마커·원 `setMap(null)`로 제거 후 재생성.
- 각 마커에 `maps.event.addListener(marker, 'click', () => onSelect(item.productId))`.
- 반경 원 `new maps.Circle({ center, radius: radiusKm * 1000, ... })`.

```tsx
import { useCallback, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/common/Button';
import { LoadingState } from '@/components/common/LoadingState';
import type { MapItem } from '@/pages/market/hooks/useNearbyItems';
import type { Coords } from '@/utils/geocode';
import { hasKakaoMapKey, loadKakaoMaps } from '@/utils/kakaoSdk';

interface MarketMapProps {
  center: Coords;
  radiusKm: number;
  items: MapItem[];
  selectedId: number | null;
  onSelect: (productId: number) => void;
}

const MAP_LEVEL = 6; // 반경 수 km가 한눈에 들어오는 수준

export function MarketMap({ center, radiusKm, items, selectedId, onSelect }: MarketMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<KakaoMap | null>(null);
  const mapsRef = useRef<KakaoMaps | null>(null);
  const markersRef = useRef<KakaoMarker[]>([]);
  const circleRef = useRef<KakaoCircle | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [reloadToken, setReloadToken] = useState(0);

  const isSupported = hasKakaoMapKey();

  // 지도 준비(1회) — center는 준비 후 별도 effect에서 옮긴다.
  useEffect(() => {
    if (!isSupported) return;
    let cancelled = false;
    setStatus('loading');
    loadKakaoMaps()
      .then((maps) => {
        if (cancelled || !containerRef.current) return;
        mapsRef.current = maps;
        if (!mapRef.current) {
          mapRef.current = new maps.Map(containerRef.current, {
            center: new maps.LatLng(center.lat, center.lng),
            level: MAP_LEVEL,
          });
        }
        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
    // center는 여기서 의도적으로 제외 — 재생성 방지(아래 effect가 이동 담당).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSupported, reloadToken]);

  // 마커·원 다시 그리기
  const redraw = useCallback(() => {
    const maps = mapsRef.current;
    const map = mapRef.current;
    if (!maps || !map) return;

    const centerLatLng = new maps.LatLng(center.lat, center.lng);
    map.setCenter(centerLatLng);

    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    circleRef.current?.setMap(null);

    circleRef.current = new maps.Circle({
      center: centerLatLng,
      radius: radiusKm * 1000,
      strokeWeight: 2,
      strokeColor: '#2f855a',
      strokeOpacity: 0.6,
      fillColor: '#38a169',
      fillOpacity: 0.08,
    });
    circleRef.current.setMap(map);

    for (const { item, coords } of items) {
      const marker = new maps.Marker({
        map,
        position: new maps.LatLng(coords.lat, coords.lng),
        title: item.name,
      });
      maps.event.addListener(marker, 'click', () => onSelect(item.productId));
      markersRef.current.push(marker);
    }
  }, [center, radiusKm, items, onSelect]);

  useEffect(() => {
    if (status === 'ready') redraw();
  }, [status, redraw]);

  if (!isSupported) {
    return (
      <p className="rounded-app border border-line bg-surface-subtle p-3 text-xs font-medium text-content-subtle">
        지도를 사용하려면 카카오 지도 앱키 설정이 필요합니다. 아래 목록으로 계속 탐색할 수 있습니다.
      </p>
    );
  }

  return (
    <div className="relative">
      <div
        aria-hidden
        className="h-72 w-full overflow-hidden rounded-app border border-line bg-surface-subtle"
        ref={containerRef}
      />
      {status === 'loading' ? (
        <div className="absolute inset-0">
          <LoadingState label="지도를 불러오는 중입니다" />
        </div>
      ) : null}
      {status === 'error' ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-app border border-line bg-surface px-4 text-center">
          <p className="text-xs font-medium text-content-muted" role="alert">
            지도를 불러오지 못했습니다.
          </p>
          <Button onClick={() => setReloadToken((t) => t + 1)} size="sm" variant="outline">
            지도 다시 불러오기
          </Button>
        </div>
      ) : null}
    </div>
  );
}
```

> 참고: `selectedId`는 이번 태스크에선 마커 강조에 쓰지 않고 다음 태스크에서 그리드 카드 강조에만 쓴다. prop으로 받아 두되 미사용 경고를 피하려면 실제로 안 쓸 경우 시그니처에서 빼도 된다 — MarketPage 통합 시 필요 여부를 판단해 반영한다.

- [ ] **Step 4: 테스트 통과 확인**

Run: `cd farmbroker-web && npx vitest run src/pages/market/components/__tests__/MarketMap.test.tsx`
Expected: PASS (2개)

- [ ] **Step 5: 커밋**

```bash
git add farmbroker-web/src/pages/market/components/MarketMap.tsx farmbroker-web/src/pages/market/components/__tests__/MarketMap.test.tsx
git commit -m "feat(web): 다중 마커 지도 컴포넌트 MarketMap

반경 원과 상품 마커를 그리고, 마커 클릭을 onSelect(productId)로 올린다.
SpaceLocationMap의 SDK 로더·로딩/에러 패턴을 따른다."
```

---

## Task 6: MarketMapSearch (주소 검색 + 반경 셀렉터)

**Files:**
- Create: `farmbroker-web/src/pages/market/components/MarketMapSearch.tsx`

주소를 입력받아 지오코딩해 중심을 올리고, 반경을 고르는 컨트롤. 앱키가 없을 때도 반경 셀렉터는 무의미하므로 이 컴포넌트는 지도 지원 시에만 MarketPage가 렌더한다.

- [ ] **Step 1: 구현**

`MarketMapSearch.tsx`:

```tsx
import { MapPin, Search } from 'lucide-react';
import { useState, type FormEvent } from 'react';

import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { RADIUS_OPTIONS_KM } from '@/constants/geo';
import { type Coords, geocodeAddress } from '@/utils/geocode';

interface MarketMapSearchProps {
  radiusKm: number;
  onRadiusChange: (km: number) => void;
  onCenterChange: (center: Coords, label: string) => void;
}

export function MarketMapSearch({ radiusKm, onRadiusChange, onCenterChange }: MarketMapSearchProps) {
  const [address, setAddress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = address.trim();
    if (!query) return;
    setIsSearching(true);
    setError(null);
    try {
      const coords = await geocodeAddress(query);
      if (!coords) {
        setError('주소를 찾지 못했습니다. 더 정확한 주소를 입력해 주세요.');
        return;
      }
      onCenterChange(coords, query);
    } catch {
      setError('주소 검색에 실패했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setIsSearching(false);
    }
  }

  return (
    <form className="grid gap-3 sm:grid-cols-[1fr_auto_auto]" onSubmit={handleSubmit}>
      <Input
        aria-label="중심 주소"
        icon={<MapPin className="h-4 w-4" aria-hidden />}
        placeholder="예: 부산광역시 금정구 장전동"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
      />
      <select
        aria-label="검색 반경"
        className="min-h-control rounded-app border border-line bg-surface px-3 text-sm font-bold"
        value={radiusKm}
        onChange={(e) => onRadiusChange(Number(e.target.value))}
      >
        {RADIUS_OPTIONS_KM.map((km) => (
          <option key={km} value={km}>
            반경 {km}km
          </option>
        ))}
      </select>
      <Button disabled={isSearching} type="submit">
        <Search className="h-4 w-4" aria-hidden />
        {isSearching ? '검색 중...' : '이 주변 검색'}
      </Button>
      {error ? (
        <p className="text-xs font-medium text-feedback-danger sm:col-span-3" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
```

> `Input`이 `icon` prop을 지원하는지 확인(다른 화면에서 `icon` 사용 중이면 그대로). 미지원이면 아이콘 없이 렌더. `Select` 공통 컴포넌트가 있으면 그걸 써도 되나, 라벨 없는 인라인 셀렉터라 여기선 native `select`로 둔다.

- [ ] **Step 2: 타입 체크**

Run: `cd farmbroker-web && npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add farmbroker-web/src/pages/market/components/MarketMapSearch.tsx
git commit -m "feat(web): 지도 검색 컨트롤 MarketMapSearch

중심 주소를 지오코딩해 올리고 반경(1/3/5/10km)을 고르는 폼."
```

---

## Task 7: MarketPage 통합 (정적 카드 대체, 지도·그리드 결과 공유)

**Files:**
- Modify: `farmbroker-web/src/pages/market/MarketPage.tsx`

정적 "부산 반경 8km 이내" 카드를 실제 `MarketMapSearch` + `MarketMap`으로 바꾸고, `useNearbyItems`로 지도·그리드를 같은 반경 결과로 묶는다. 마커 클릭 시 해당 카드를 강조·스크롤한다.

- [ ] **Step 1: 상태·훅 연결**

`MarketPage` 상단에 추가:

```tsx
import { useRef, useState } from 'react';
import { MarketMap } from '@/pages/market/components/MarketMap';
import { MarketMapSearch } from '@/pages/market/components/MarketMapSearch';
import { useNearbyItems } from '@/pages/market/hooks/useNearbyItems';
import { DEFAULT_MAP_CENTER, DEFAULT_RADIUS_KM } from '@/constants/geo';
import { hasKakaoMapKey } from '@/utils/kakaoSdk';
import type { Coords } from '@/utils/geocode';
```

컴포넌트 본문:

```tsx
  const [center, setCenter] = useState<Coords>(DEFAULT_MAP_CENTER);
  const [centerLabel, setCenterLabel] = useState('부산시청');
  const [radiusKm, setRadiusKm] = useState(DEFAULT_RADIUS_KM);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const cardRefs = useRef(new Map<number, HTMLDivElement>());

  const mapSupported = hasKakaoMapKey();
  const { mapItems, visibleItems, distances } = useNearbyItems(items, center, radiusKm);
  // 앱키가 없으면 반경 개념이 없으므로 서버가 준 전체를 그대로 보인다.
  const gridItems = mapSupported ? visibleItems : items;

  function handleSelect(productId: number) {
    setSelectedId(productId);
    cardRefs.current.get(productId)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
```

- [ ] **Step 2: 정적 카드 → 검색 카드 교체**

기존 `PageHeader`의 `action` 안 "부산 반경 8km 이내" `Card`를 제거하고(장바구니/판매관리/상품등록 링크는 유지), `PageHeader` 아래·기존 검색 `Card` 위에 지도 블록을 추가:

```tsx
      {mapSupported ? (
        <Card className="mt-6 grid gap-4" padding="md">
          <MarketMapSearch
            radiusKm={radiusKm}
            onRadiusChange={setRadiusKm}
            onCenterChange={(coords, label) => {
              setCenter(coords);
              setCenterLabel(label);
            }}
          />
          <MarketMap
            center={center}
            radiusKm={radiusKm}
            items={mapItems}
            selectedId={selectedId}
            onSelect={handleSelect}
          />
          <p className="text-xs font-medium text-content-subtle">
            <span className="font-bold text-action">{centerLabel}</span> 반경 {radiusKm}km ·
            {' '}상품 {mapItems.length}곳
          </p>
        </Card>
      ) : null}
```

- [ ] **Step 3: 그리드를 반경 결과로 교체 + 카드 강조/거리 표시**

기존 `items.map((item) => <ProductCard ... />)`를 `gridItems`로 바꾸고, 강조·스크롤용 래퍼를 씌운다:

```tsx
        {status === 'success' && gridItems.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {gridItems.map((item) => (
              <div
                key={item.productId}
                ref={(el) => {
                  if (el) cardRefs.current.set(item.productId, el);
                  else cardRefs.current.delete(item.productId);
                }}
                className={
                  selectedId === item.productId ? 'rounded-app ring-2 ring-leaf-500' : undefined
                }
              >
                <ProductCard item={item} distanceKm={distances.get(item.productId) ?? null} />
              </div>
            ))}
          </div>
        ) : null}
```

빈 상태 조건도 `gridItems.length === 0`으로 맞춘다.

- [ ] **Step 4: ProductCard에 거리 표시(선택적 prop) 추가**

`ProductCard.tsx`의 props에 `distanceKm?: number | null` 추가, 마일리지 줄에 거리 노출:

```tsx
interface ProductCardProps {
  item: MarketItem;
  distanceKm?: number | null;
}
```

기존 마일리지 `<p>` 안에서, `distanceKm != null`이면 `중심에서 {distanceKm.toFixed(1)}km · ` 를 앞에 덧붙인다(없으면 기존 그대로).

- [ ] **Step 5: 전체 마켓 테스트 실행(회귀 확인)**

Run: `cd farmbroker-web && npx vitest run src/pages/market`
Expected: PASS (기존 MarketPage/ProductForm 등 + 신규 전부). 실패 시 mock/셀렉터 조정.

- [ ] **Step 6: 커밋**

```bash
git add farmbroker-web/src/pages/market/MarketPage.tsx farmbroker-web/src/pages/market/components/ProductCard.tsx
git commit -m "feat(web): 마켓 페이지에 지도 검색 통합

정적 반경 카드를 실제 지도+주소검색으로 대체하고, useNearbyItems로
지도 마커와 상품 그리드가 같은 반경 결과를 공유한다. 마커 클릭 시
해당 카드를 강조·스크롤하고 카드에 중심 거리(km)를 표시한다."
```

> **PR 시점:** 이 태스크까지 끝나면 프론트 기능이 동작하는 단위다. 사용자가 push/PR을 올릴 수 있으니 알린다. (등록 폼 좌표 저장 Task 8은 후속 커밋으로 같은 PR/브랜치에 이어도 되고, 원하면 여기서 먼저 PR.)

---

## Task 8: 상품 등록 시 주소 지오코딩해 좌표 저장

**Files:**
- Modify: `farmbroker-web/src/pages/market/ProductFormPage.tsx`
- Modify: `farmbroker-web/src/services/marketService.ts`

지금은 좌표가 저장되지 않아 새 상품이 지도에 안 뜬다(주소 폴백 지오코딩에만 의존). 등록·수정 시 주소를 지오코딩해 lat/lng를 함께 저장한다.

- [ ] **Step 1: 실패 테스트 작성/보강**

`ProductFormPage`의 기존 테스트 파일에 케이스 추가 — 제출 시 지오코딩된 lat/lng가 `createProduct` payload에 포함되는지. 지도 mock으로 `geocodeAddress`를 대체:

```tsx
// 상단 mock
vi.mock('@/utils/geocode', async () => {
  const actual = await vi.importActual<typeof import('@/utils/geocode')>('@/utils/geocode');
  return { ...actual, geocodeAddress: vi.fn().mockResolvedValue({ lat: 35.18, lng: 129.076 }) };
});
```

테스트: 주소 입력 후 제출 → `createProduct`가 `latitude: 35.18, longitude: 129.076` 포함해 호출.

> 기존 `ProductFormPage.test.tsx` 구조를 먼저 확인해 셀렉터·헬퍼(예: `createProduct` mock 방식)를 맞춘다. 주소 칸은 자유 입력이므로 `user.type`으로 채운다.

- [ ] **Step 2: 테스트 실패 확인**

Run: `cd farmbroker-web && npx vitest run src/pages/market/__tests__/ProductFormPage.test.tsx`
Expected: FAIL (payload에 좌표 없음)

- [ ] **Step 3: 구현 — 제출 시 지오코딩**

`ProductFormPage.tsx`의 `handleSubmit`에서 payload 구성 전, 주소가 있으면 지오코딩:

```tsx
import { geocodeAddress } from '@/utils/geocode';

// handleSubmit 내부, payload 만들기 직전
const trimmedAddress = fields.address.trim();
let coords: { lat: number; lng: number } | null = null;
if (trimmedAddress) {
  // 지오코딩 실패는 저장을 막지 않는다 — 좌표 없이 등록하고 조회 시 폴백 지오코딩된다.
  coords = await geocodeAddress(trimmedAddress).catch(() => null);
}
```

payload에 반영(기존 `address` 줄 근처):

```tsx
      address: trimmedAddress || null,
      latitude: coords?.lat ?? null,
      longitude: coords?.lng ?? null,
      spaceId,
```

`ProductInput` 타입(`types/api.ts`)에는 `latitude/longitude`가 **없으므로 추가한다**(백엔드는 이미 수용). `address?` 줄 아래에:

```ts
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
```

또한 파일 상단 주석 "위경도·푸드 마일리지는 지도 연동(Task 3)에서 서버가 채우므로 이 폼에서 받지 않습니다."를 "주소를 지오코딩해 위경도를 함께 저장합니다(실패해도 등록은 진행, 조회 시 폴백)."로 갱신.

- [ ] **Step 4: mock 서비스 좌표 반영**

`marketService.ts`의 `toMockProduct`에서 `latitude: null, longitude: null`을 입력값 반영으로:

```tsx
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
```

- [ ] **Step 5: 테스트 통과 확인**

Run: `cd farmbroker-web && npx vitest run src/pages/market/__tests__/ProductFormPage.test.tsx`
Expected: PASS

- [ ] **Step 6: 전체 프론트 테스트 + 타입/린트**

Run: `cd farmbroker-web && npx vitest run && npx tsc --noEmit && npm run lint`
Expected: 전부 통과

- [ ] **Step 7: 커밋**

```bash
git add farmbroker-web/src/pages/market/ProductFormPage.tsx farmbroker-web/src/services/marketService.ts farmbroker-web/src/types/api.ts
git commit -m "feat(web): 상품 등록 시 주소를 지오코딩해 좌표 저장

등록·수정 시 생산지 주소를 카카오로 지오코딩해 latitude/longitude를
함께 저장한다(실패해도 등록은 진행, 조회 시 폴백 지오코딩). 새 상품이
바로 지도에 표시된다."
```

---

## Task 9: 실제 앱 검증 + PR 안내

**Files:** 없음(수동 검증)

- [ ] **Step 1: 실행 검증 (`/verify` 또는 수동)**
  - 백엔드 `bootRun` + 프론트 `npm run dev`(`.env`의 `VITE_USE_MOCKS=false`).
  - 마켓 진입 → 지도에 반경 원·마커 표시 확인.
  - 주소 검색 → 중심 이동·마커 갱신, 반경 변경 → 필터 갱신.
  - 마커 클릭 → 하단 카드 강조·스크롤.
  - FARMER 계정으로 주소 넣어 상품 등록 → 마켓 지도에 즉시 표시.
  - 앱키를 잠시 비웠을 때(선택) 지도 자리 안내 문구 + 그리드 전체 노출 확인.

- [ ] **Step 2: 커밋할 것 없으면 사용자에게 PR 안내**

  구현·검증 완료. **여기서 멈추고 사용자에게 알린다:**
  > "지도 검색 구현·검증 완료. 이제 `git push` 후 PR을 올리면 됩니다. 브랜치: `feature/market-map-search`."

  (push/PR은 사용자가 직접 한다 — Claude가 push하지 않는다.)

---

## 검증 요약

- 유닛: `geocode`(5), `useNearbyItems`(4), `MarketMap`(2), `ProductFormPage`(추가 1) + 기존 마켓 테스트 회귀.
- 타입: `tsc --noEmit` 무에러. 린트: `npm run lint` 통과.
- 백엔드: `compileJava` 성공(한글 경로라 `test`는 CI).
- 수동: 실제 앱에서 지도 검색·등록 표시 end-to-end.
