# 공간 지도 탐색 기능 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 공간 목록 페이지에서 주소+반경으로 주변 공실 공간을 지도 마커로 탐색한다(로컬 마켓과 동일 UX).

**Architecture:** 백엔드는 상품(Product) 좌표 저장 패턴을 Space에 미러링한다. 프론트는 마켓의 `MarketMap`/`MarketMapSearch`/`useNearbyItems`를 엔티티 무관 제네릭(`NearbyMap`/`NearbyMapSearch`/`useNearbyPlaces`)으로 승격해 마켓·공간이 공유하고, 공간 페이지는 어댑터만 주입한다. 좌표 없는 기존 공간은 프론트 폴백 지오코딩으로 표시한다.

**Tech Stack:** Spring Boot(JPA), React 19 + TypeScript, Vite, Vitest, 카카오 지도 SDK.

**참고 문서:** 설계 `docs/specs/2026-08-16-space-map-search-design.md`, 선행 마켓 계획 `docs/plans/2026-08-16-market-map-search.md`.

**환경 주의 (메모리):**
- 지도/지오코딩 프론트 테스트는 `@/utils/kakaoSdk`의 `hasKakaoMapKey`를 `() => true`로 mock해야 CI(앱키 없음)에서 통과한다. 로컬 CI 재현: `VITE_KAKAO_MAP_APP_KEY= npx vitest run <file>`.
- 백엔드 `./gradlew test`는 한글 경로에서 로컬 실패한다 → JUnit 테스트는 작성하되 **로컬 검증은 실행 중인 Docker 백엔드 + curl 스모크**로 하고, 단위테스트는 CI에서 확인한다. curl은 `--noproxy "*"` + `127.0.0.1` 사용.

---

## 파일 구조

**백엔드 (수정):**
- `farmbroker/.../space/domain/Space.java` — latitude/longitude 필드 + builder + update()
- `farmbroker/.../space/dto/SpaceCreateRequest.java` — 좌표 필드 + 범위 검증
- `farmbroker/.../space/dto/SpaceUpdateRequest.java` — 좌표 필드
- `farmbroker/.../space/service/SpaceService.java` — create 빌더 / update 전달
- `farmbroker/.../space/dto/SpaceListItemResponse.java` — 좌표 노출
- `farmbroker/.../space/dto/SpaceDetailResponse.java` — 좌표 노출
- `farmbroker/.../space/dto/SpaceResponse.java` — 좌표 노출

**프론트 (신규 공용):**
- `farmbroker-web/src/components/map/useNearbyPlaces.ts` — 제네릭 반경 필터 + 폴백 지오코딩 훅
- `farmbroker-web/src/components/map/NearbyMap.tsx` — 제네릭 다중 마커 지도
- `farmbroker-web/src/components/map/NearbyMapSearch.tsx` — 제네릭 주소+반경 검색

**프론트 (수정):**
- `farmbroker-web/src/types/api.ts` — Space 좌표 필드
- `farmbroker-web/src/services/spaceService.ts` — create/update 좌표 통과 + mock 좌표 유지
- `farmbroker-web/src/pages/market/MarketPage.tsx` — 제네릭 + 상품 어댑터로 전환
- `farmbroker-web/src/pages/spaces/SpacesPage.tsx` — 지도 통합 + 공간 어댑터
- `farmbroker-web/src/pages/spaces/components/SpaceCard.tsx` — distanceKm prop
- `farmbroker-web/src/pages/spaces/SpaceCreatePage.tsx` — 제출 시 지오코딩→좌표 전송

**프론트 (제거, 제네릭으로 대체):**
- `farmbroker-web/src/pages/market/components/MarketMap.tsx`
- `farmbroker-web/src/pages/market/components/MarketMapSearch.tsx`
- `farmbroker-web/src/pages/market/hooks/useNearbyItems.ts`
- 관련 테스트는 제네릭 위치로 이관

---

## Task 1: 백엔드 — Space 엔티티 좌표 필드

**Files:**
- Modify: `farmbroker/src/main/java/com/farmbroker/farmbroker/space/domain/Space.java`

- [ ] **Step 1: latitude/longitude 컬럼 추가**

`description` 필드(라인 66) 아래, `@Enumerated` status 위에 추가:

```java
    // 지도 검색용 좌표. 등록/수정 시 프론트가 주소를 지오코딩해 채운다. 없으면 프론트가 폴백 지오코딩한다.
    @Column
    private Double latitude;

    @Column
    private Double longitude;
```

- [ ] **Step 2: 빌더 생성자에 좌표 추가**

`@Builder public Space(...)` 시그니처 끝에 `Double latitude, Double longitude`를 추가하고 본문에 대입:

```java
    @Builder
    public Space(User owner, String title, String address, BigDecimal area, Integer monthlyRent,
                 Integer floor, boolean hasWater, boolean hasElectricity, boolean hasVentilation,
                 String description, Double latitude, Double longitude) {
        // ...기존 대입 유지...
        this.description = description;
        this.latitude = latitude;
        this.longitude = longitude;
        this.status = SpaceStatus.AVAILABLE;
        this.deleted = false;
    }
```

- [ ] **Step 3: update()에 좌표 부분수정 추가**

`update(...)` 시그니처 끝에 `Double latitude, Double longitude` 추가, 본문 끝에:

```java
        if (description != null) this.description = description;
        if (latitude != null) this.latitude = latitude;
        if (longitude != null) this.longitude = longitude;
```

- [ ] **Step 4: 컴파일 확인 (컨테이너 빌드)**

Run: `docker compose build backend`
Expected: BUILD SUCCESS (컴파일 통과). 아직 호출부는 안 고쳤으므로 SpaceService가 새 빌더 파라미터를 안 줘도 Lombok @Builder는 선택적이라 컴파일됨.

- [ ] **Step 5: Commit**

```bash
git add farmbroker/src/main/java/com/farmbroker/farmbroker/space/domain/Space.java
git commit -m "feat(space): Space 엔티티에 latitude/longitude 추가"
```

---

## Task 2: 백엔드 — 요청 DTO 좌표 필드

**Files:**
- Modify: `farmbroker/.../space/dto/SpaceCreateRequest.java`
- Modify: `farmbroker/.../space/dto/SpaceUpdateRequest.java`

- [ ] **Step 1: SpaceCreateRequest에 좌표 필드 추가**

`description` 필드 아래에 추가(선택값, 범위 검증). import에 `jakarta.validation.constraints.DecimalMin/DecimalMax`가 이미 있으면 재사용:

```java
    // 지도용 좌표(선택). 프론트가 주소를 지오코딩해 보낸다. 실패 시 null 허용.
    @DecimalMin(value = "-90.0", message = "위도는 -90~90 사이여야 합니다.")
    @DecimalMax(value = "90.0", message = "위도는 -90~90 사이여야 합니다.")
    private Double latitude;

    @DecimalMin(value = "-180.0", message = "경도는 -180~180 사이여야 합니다.")
    @DecimalMax(value = "180.0", message = "경도는 -180~180 사이여야 합니다.")
    private Double longitude;
```

- [ ] **Step 2: SpaceUpdateRequest에 동일 좌표 필드 추가** (동일 코드)

- [ ] **Step 3: Commit**

```bash
git add farmbroker/src/main/java/com/farmbroker/farmbroker/space/dto/SpaceCreateRequest.java farmbroker/src/main/java/com/farmbroker/farmbroker/space/dto/SpaceUpdateRequest.java
git commit -m "feat(space): 공간 등록/수정 요청에 좌표 필드 추가"
```

---

## Task 3: 백엔드 — 서비스가 좌표 저장

**Files:**
- Modify: `farmbroker/.../space/service/SpaceService.java`
- Test: 로컬은 curl 스모크, 단위테스트는 `farmbroker/.../space/service/SpaceServiceTest.java`가 있으면 케이스 추가

- [ ] **Step 1: create() 빌더에 좌표 전달**

`create()`의 `Space.builder()...` 체인에서 `.description(request.getDescription())` 다음에 추가:

```java
                .description(request.getDescription())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .build());
```

- [ ] **Step 2: update()에서 space.update()에 좌표 전달**

`space.update(...)` 호출 마지막 인자에 좌표 추가:

```java
        space.update(request.getTitle(), request.getAddress(), request.getArea(),
                request.getMonthlyRent(), request.getFloor(), request.getHasWater(),
                request.getHasElectricity(), request.getHasVentilation(), request.getDescription(),
                request.getLatitude(), request.getLongitude());
```

- [ ] **Step 3: 백엔드 재빌드·기동**

Run: `docker compose up -d --build backend`
Expected: 컨테이너 정상 기동, `curl --noproxy "*" http://127.0.0.1:8080/api/products` → HTTP 200.

- [ ] **Step 4: curl 스모크 — 공간 등록 시 좌표 저장·조회 확인**

FARMER/OWNER 상관없이 로그인 사용자면 공간 등록 가능. 로그인 쿠키로 좌표 포함 등록 후 목록에서 좌표 확인:

```bash
# 로그인(기존 seller3@farm.test / Test1234! 또는 새 계정) → 쿠키 확보 후
# POST /api/spaces (도면 URL 1개 필수, floorPlanUrls) with latitude/longitude
# 그 뒤 GET /api/spaces 목록 응답 항목에 latitude/longitude가 내려오는지 확인
```
Expected: 등록 응답·목록 응답 JSON에 저장한 `latitude/longitude`가 그대로 포함.

- [ ] **Step 5: (선택) SpaceServiceTest 케이스 추가** — create가 좌표를 저장하고 update가 좌표를 부분수정하는지. CI에서 실행.

- [ ] **Step 6: Commit**

```bash
git add farmbroker/src/main/java/com/farmbroker/farmbroker/space/service/SpaceService.java
git commit -m "feat(space): 등록/수정 시 좌표 저장"
```

---

## Task 4: 백엔드 — 응답 DTO 좌표 노출

**Files:**
- Modify: `farmbroker/.../space/dto/SpaceListItemResponse.java`
- Modify: `farmbroker/.../space/dto/SpaceDetailResponse.java`
- Modify: `farmbroker/.../space/dto/SpaceResponse.java`

- [ ] **Step 1: SpaceListItemResponse에 좌표 추가**

필드 + 생성자 대입 추가(목록 지도가 이 응답의 좌표를 읽으므로 필수):

```java
    private final String imageUrl;
    private final Double latitude;
    private final Double longitude;

    private SpaceListItemResponse(Space space, String imageUrl) {
        // ...기존...
        this.imageUrl = imageUrl;
        this.latitude = space.getLatitude();
        this.longitude = space.getLongitude();
    }
```

- [ ] **Step 2: SpaceDetailResponse에 좌표 추가** (동일 방식으로 필드 + from/생성자 대입. 파일 구조 확인 후 반영.)

- [ ] **Step 3: SpaceResponse에 좌표 추가** (등록/수정 응답. from()에서 space.getLatitude()/getLongitude() 대입.)

- [ ] **Step 4: 재빌드·curl 확인**

Run: `docker compose up -d --build backend` 후 GET /api/spaces, GET /api/spaces/{id} 응답에 latitude/longitude 포함 확인.

- [ ] **Step 5: Commit**

```bash
git add farmbroker/src/main/java/com/farmbroker/farmbroker/space/dto/SpaceListItemResponse.java farmbroker/src/main/java/com/farmbroker/farmbroker/space/dto/SpaceDetailResponse.java farmbroker/src/main/java/com/farmbroker/farmbroker/space/dto/SpaceResponse.java
git commit -m "feat(space): 목록·상세·등록 응답에 좌표 노출"
```

---

## Task 5: 프론트 — Space 타입 + 서비스 좌표

**Files:**
- Modify: `farmbroker-web/src/types/api.ts`
- Modify: `farmbroker-web/src/services/spaceService.ts`

- [ ] **Step 1: 타입에 좌표 추가**

`SpaceSummary`에 `latitude?: number | null; longitude?: number | null;` 추가. `SpaceCreateInput`, `SpaceUpdateInput`(SpaceCreateInput 기반)에도 `latitude?/longitude?` 추가.

- [ ] **Step 2: spaceService mock이 좌표 유지**

`spaceService.ts`의 mock create/update가 입력 좌표를 저장 객체에 통과시키고, mock 목록이 그대로 반환하도록 `latitude/longitude`를 매핑에 포함. 실서버 경로는 JSON 통과라 별도 작업 불필요.

- [ ] **Step 3: 타입체크**

Run: `cd farmbroker-web && npx tsc --noEmit`
Expected: 에러 없음.

- [ ] **Step 4: Commit**

```bash
git add farmbroker-web/src/types/api.ts farmbroker-web/src/services/spaceService.ts
git commit -m "feat(web): Space 타입·서비스에 좌표 필드 추가"
```

---

## Task 6: 프론트 — 제네릭 useNearbyPlaces 훅

**Files:**
- Create: `farmbroker-web/src/components/map/useNearbyPlaces.ts`
- Test: `farmbroker-web/src/components/map/__tests__/useNearbyPlaces.test.tsx`

`useNearbyItems`(상품 전용)를 제네릭화한다. 어댑터로 id/좌표/주소를 뽑는다.

- [ ] **Step 1: 실패 테스트 작성** (마켓 테스트를 제네릭 어댑터 기반으로 이관 + hasKakaoMapKey mock 필수)

```tsx
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { useNearbyPlaces, type NearbyAdapter } from '@/components/map/useNearbyPlaces';

const geocodeAddress = vi.fn();
vi.mock('@/utils/geocode', async () => {
  const actual = await vi.importActual<typeof import('@/utils/geocode')>('@/utils/geocode');
  return { ...actual, geocodeAddress: (a: string) => geocodeAddress(a) };
});
// CI엔 앱키가 없어 hasKakaoMapKey=false → 폴백 스킵. 앰비언트 env 의존 제거.
vi.mock('@/utils/kakaoSdk', async () => {
  const actual = await vi.importActual<typeof import('@/utils/kakaoSdk')>('@/utils/kakaoSdk');
  return { ...actual, hasKakaoMapKey: () => true };
});

type Row = { id: number; lat: number | null; lng: number | null; addr: string | null };
const adapter: NearbyAdapter<Row> = {
  getId: (r) => r.id,
  getDirectCoords: (r) => (r.lat != null && r.lng != null ? { lat: r.lat, lng: r.lng } : null),
  getAddress: (r) => r.addr,
};
const center = { lat: 35.1798, lng: 129.075 };

describe('useNearbyPlaces', () => {
  beforeEach(() => geocodeAddress.mockReset());

  it('저장된 좌표로 반경 내/외를 나눈다', async () => {
    const near: Row = { id: 1, lat: 35.18, lng: 129.076, addr: null };
    const far: Row = { id: 2, lat: 35.4, lng: 129.3, addr: null };
    const { result } = renderHook(() => useNearbyPlaces([near, far], center, 5, adapter));
    await waitFor(() => expect(result.current.mapItems).toHaveLength(1));
    expect(result.current.mapItems[0].item.id).toBe(1);
  });

  it('좌표 없고 주소만 있으면 지오코딩 폴백', async () => {
    geocodeAddress.mockResolvedValue({ lat: 35.18, lng: 129.076 });
    const row: Row = { id: 3, lat: null, lng: null, addr: '부산 어딘가' };
    const { result } = renderHook(() => useNearbyPlaces([row], center, 5, adapter));
    await waitFor(() => expect(result.current.mapItems).toHaveLength(1));
    expect(geocodeAddress).toHaveBeenCalledWith('부산 어딘가');
  });

  it('좌표·주소 모두 없으면 visible엔 남고 지도엔 없음', async () => {
    const row: Row = { id: 4, lat: null, lng: null, addr: null };
    const { result } = renderHook(() => useNearbyPlaces([row], center, 5, adapter));
    await waitFor(() => expect(result.current.visibleItems.map((r) => r.id)).toEqual([4]));
    expect(result.current.mapItems).toHaveLength(0);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `VITE_KAKAO_MAP_APP_KEY= npx vitest run src/components/map/__tests__/useNearbyPlaces.test.tsx`
Expected: FAIL (모듈 없음).

- [ ] **Step 3: 훅 구현** (기존 useNearbyItems 로직 제네릭화)

```ts
import { useEffect, useMemo, useState } from 'react';
import { type Coords, geocodeAddress, haversineKm } from '@/utils/geocode';
import { hasKakaoMapKey } from '@/utils/kakaoSdk';

export interface NearbyAdapter<T> {
  getId: (item: T) => number;
  getDirectCoords: (item: T) => Coords | null;
  getAddress: (item: T) => string | null;
}
export interface NearbyMapItem<T> { item: T; coords: Coords; distanceKm: number; }
interface NearbyResult<T> {
  mapItems: NearbyMapItem<T>[];
  visibleItems: T[];
  distances: Map<number, number>;
}

export function useNearbyPlaces<T>(
  items: T[], center: Coords, radiusKm: number, adapter: NearbyAdapter<T>,
): NearbyResult<T> {
  const [resolved, setResolved] = useState<Map<number, Coords>>(new Map());

  useEffect(() => {
    if (!hasKakaoMapKey()) return;
    let cancelled = false;
    const missing = items.filter(
      (it) => adapter.getDirectCoords(it) === null && adapter.getAddress(it),
    );
    void Promise.all(
      missing.map(async (it) => {
        const coords = await geocodeAddress(adapter.getAddress(it) as string).catch(() => null);
        return coords ? ([adapter.getId(it), coords] as const) : null;
      }),
    ).then((entries) => {
      if (cancelled) return;
      setResolved((prev) => {
        const next = new Map(prev);
        for (const e of entries) if (e) next.set(e[0], e[1]);
        return next;
      });
    });
    return () => { cancelled = true; };
  }, [items, adapter]);

  return useMemo(() => {
    const mapItems: NearbyMapItem<T>[] = [];
    const unlocated: T[] = [];
    for (const it of items) {
      const coords = adapter.getDirectCoords(it) ?? resolved.get(adapter.getId(it)) ?? null;
      if (!coords) { unlocated.push(it); continue; }
      const distanceKm = haversineKm(center, coords);
      if (distanceKm <= radiusKm) mapItems.push({ item: it, coords, distanceKm });
    }
    mapItems.sort((a, b) => a.distanceKm - b.distanceKm);
    const distances = new Map(mapItems.map((m) => [adapter.getId(m.item), m.distanceKm]));
    const visibleItems = [...mapItems.map((m) => m.item), ...unlocated];
    return { mapItems, visibleItems, distances };
  }, [items, center, radiusKm, resolved, adapter]);
}
```

> 주의: 호출부에서 `adapter` 객체는 `useMemo`로 안정화해 effect 무한 루프를 피한다(Task 8/마켓 리팩터에서 반영).

- [ ] **Step 4: 테스트 통과 확인**

Run: `VITE_KAKAO_MAP_APP_KEY= npx vitest run src/components/map/__tests__/useNearbyPlaces.test.tsx`
Expected: PASS (3 passed). 키 있는 조건도 통과: `npx vitest run ...` 재실행.

- [ ] **Step 5: Commit**

```bash
git add farmbroker-web/src/components/map/useNearbyPlaces.ts farmbroker-web/src/components/map/__tests__/useNearbyPlaces.test.tsx
git commit -m "feat(web): 제네릭 반경 필터 훅 useNearbyPlaces 추가"
```

---

## Task 7: 프론트 — 제네릭 NearbyMap 컴포넌트

**Files:**
- Create: `farmbroker-web/src/components/map/NearbyMap.tsx`
- Test: `farmbroker-web/src/components/map/__tests__/NearbyMap.test.tsx`

`MarketMap`을 제네릭화. props로 `getTitle(item)` 받고 `onSelect(id)` 호출.

- [ ] **Step 1: 실패 테스트 작성** (MarketMap.test 이관 — `createKakaoMapMock` 사용, `mapItem`을 제네릭 형태로)

```tsx
// vi.hoisted + vi.mock('@/utils/kakaoSdk', () => createKakaoMapMock().module) 패턴은 MarketMap.test와 동일.
// NearbyMap<{id;name}> 렌더 후 mapMock.markers 길이/클릭 onSelect(id) 검증.
```

- [ ] **Step 2: 실패 확인** — `npx vitest run src/components/map/__tests__/NearbyMap.test.tsx` → FAIL.

- [ ] **Step 3: 구현** (MarketMap 로직 복사 후 제네릭화)

`MarketMapProps`를 다음으로 대체:
```ts
interface NearbyMapProps<T> {
  center: Coords;
  radiusKm: number;
  items: NearbyMapItem<T>[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  getId: (item: T) => number;
  getTitle: (item: T) => string;
}
```
`redraw`의 마커 루프에서 `title: getTitle(item)`, 클릭 리스너 `onSelect(getId(item))`로 교체. 나머지(지도 1회 생성, center 이동, 반경 원, 앱키 없음 안내)는 그대로.

- [ ] **Step 4: 통과 확인** — `npx vitest run src/components/map/__tests__/NearbyMap.test.tsx` → PASS.

- [ ] **Step 5: Commit**

```bash
git add farmbroker-web/src/components/map/NearbyMap.tsx farmbroker-web/src/components/map/__tests__/NearbyMap.test.tsx
git commit -m "feat(web): 제네릭 다중 마커 지도 NearbyMap 추가"
```

---

## Task 8: 프론트 — 제네릭 NearbyMapSearch

**Files:**
- Create: `farmbroker-web/src/components/map/NearbyMapSearch.tsx`

`MarketMapSearch`를 엔티티 무관 공용으로 승격(내용은 사실상 동일 — 상품 의존 없음). placeholder만 prop으로 받도록 확장.

- [ ] **Step 1: 구현** — `MarketMapSearch` 내용을 복사하고 `placeholder?: string` prop 추가(기본값 유지). props: `radiusKm, onRadiusChange, onCenterChange, placeholder?`.

- [ ] **Step 2: 스모크 테스트(선택)** — 주소 입력 후 제출 시 `onCenterChange`가 호출되는지(geocode mock).

- [ ] **Step 3: 타입체크** — `npx tsc --noEmit`.

- [ ] **Step 4: Commit**

```bash
git add farmbroker-web/src/components/map/NearbyMapSearch.tsx
git commit -m "feat(web): 제네릭 주소+반경 검색 NearbyMapSearch 추가"
```

---

## Task 9: 프론트 — 마켓을 제네릭으로 전환 + 옛 컴포넌트 제거

**Files:**
- Modify: `farmbroker-web/src/pages/market/MarketPage.tsx`
- Delete: `MarketMap.tsx`, `MarketMapSearch.tsx`, `hooks/useNearbyItems.ts` + 각 `__tests__`
- Move: 필요한 테스트는 Task 6/7에서 이미 제네릭 위치로 이관됨

- [ ] **Step 1: MarketPage에 상품 어댑터 도입**

```tsx
const productAdapter = useMemo<NearbyAdapter<MarketItem>>(() => ({
  getId: (i) => i.productId,
  getDirectCoords: (i) => (i.latitude != null && i.longitude != null ? { lat: i.latitude, lng: i.longitude } : null),
  getAddress: (i) => i.address ?? null,
}), []);
const { mapItems, visibleItems, distances } = useNearbyPlaces(items, center, radiusKm, productAdapter);
```
지도/검색을 `NearbyMapSearch` + `NearbyMap`(getId=productId, getTitle=name)로 교체. 기존 `mapItems.length`, `distances`, `handleSelect` 로직은 유지.

- [ ] **Step 2: 옛 컴포넌트·훅·테스트 삭제**

```bash
git rm farmbroker-web/src/pages/market/components/MarketMap.tsx \
       farmbroker-web/src/pages/market/components/MarketMapSearch.tsx \
       farmbroker-web/src/pages/market/hooks/useNearbyItems.ts \
       farmbroker-web/src/pages/market/components/__tests__/MarketMap.test.tsx \
       farmbroker-web/src/pages/market/hooks/__tests__/useNearbyItems.test.tsx
```

- [ ] **Step 3: 전체 프론트 검증 (CI 조건)**

Run: `VITE_KAKAO_MAP_APP_KEY= npx vitest run` 그리고 `npm run lint` 그리고 `npx tsc --noEmit`
Expected: 전부 통과. 마켓 관련 회귀 없음(`MarketPage.test` 포함).

- [ ] **Step 4: 로컬 앱 확인** — dev 서버에서 `/market` 지도·검색·마커 동작 확인.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor(web): 마켓 지도를 제네릭 컴포넌트로 전환하고 옛 컴포넌트 제거"
```

---

## Task 10: 프론트 — SpaceCard 거리 표시

**Files:**
- Modify: `farmbroker-web/src/pages/spaces/components/SpaceCard.tsx`

- [ ] **Step 1: distanceKm prop 추가**

`interface SpaceCardProps`에 `distanceKm?: number | null` 추가. 주소 줄(`space.address`) 옆 또는 아래에 거리 뱃지 표시(값이 있을 때만):

```tsx
{distanceKm != null ? (
  <span className="text-xs font-bold text-action">{distanceKm.toFixed(1)}km</span>
) : null}
```
(마켓 `ProductCard`의 거리 표시 방식과 톤 맞춤. 기존 렌더는 유지.)

- [ ] **Step 2: 타입체크·기존 SpaceCard 테스트 통과**

Run: `npx vitest run src/pages/spaces/__tests__/SpaceCard.test.tsx`
Expected: PASS(거리 prop은 선택값이라 기존 테스트 영향 없음).

- [ ] **Step 3: Commit**

```bash
git add farmbroker-web/src/pages/spaces/components/SpaceCard.tsx
git commit -m "feat(web): SpaceCard에 거리(distanceKm) 표시 추가"
```

---

## Task 11: 프론트 — SpacesPage 지도 통합

**Files:**
- Modify: `farmbroker-web/src/pages/spaces/SpacesPage.tsx`
- Test: `farmbroker-web/src/pages/spaces/__tests__/SpacesPage.test.tsx` (반경×필터 케이스 추가)

- [ ] **Step 1: 실패 테스트 추가** — 앱키 mock(true) + 지오코딩 mock 후, 주소 검색 시 반경 밖 공간이 목록에서 사라지는지(반경이 목록 필터). `createKakaoMapMock` + geocode mock 활용. 기존 "키워드 필터" 테스트는 유지.

- [ ] **Step 2: 실패 확인** — `npx vitest run src/pages/spaces/__tests__/SpacesPage.test.tsx` → 새 케이스 FAIL.

- [ ] **Step 3: SpacesPage에 지도 통합 구현**

- `hasKakaoMapKey()`로 `mapSupported` 판단.
- `useState`로 `center`(기본 `DEFAULT_MAP_CENTER`), `centerLabel`(기본 '부산시청'), `radiusKm`(`DEFAULT_RADIUS_KM`), `selectedId`.
- 공간 어댑터(useMemo): `getId=spaceId, getDirectCoords=lat/lng, getAddress=address`.
- `useNearbyPlaces(spaces.content, center, radiusKm, spaceAdapter)` → `{ mapItems, visibleItems, distances }`.
- `mapSupported`면 지도 카드(`Card` + `NearbyMapSearch`(placeholder="예: 부산광역시 금정구 장전동") + `NearbyMap`(getId=spaceId, getTitle=title)) 렌더. 하단 요약 문구(중심 라벨·반경·공간 수).
- **목록 = 반경 필터 결과**: `mapSupported ? visibleItems : spaces.content`를 `SpaceList`에 전달. 면적/월세/정렬 필터(`SpaceFilter`)는 서버 쿼리로 이미 적용됨 → 반경과 AND로 결합(서버 필터된 목록에 프론트 반경 필터가 얹힘).
- 마커 클릭 → `SpaceList` 내 해당 카드 스크롤·하이라이트(마켓 `handleSelect`와 동일 패턴). `SpaceList`가 ref/selectedId를 받도록 소폭 확장하거나, 카드에 `distanceKm`만 전달하고 하이라이트는 후속으로 둘 수 있음(YAGNI 판단은 실행 시).

`SpaceList`에 `distances`를 넘겨 각 `SpaceCard`에 `distanceKm={distances.get(space.spaceId) ?? null}` 전달.

- [ ] **Step 4: 통과 확인 (CI 조건 포함)**

Run: `VITE_KAKAO_MAP_APP_KEY= npx vitest run src/pages/spaces/__tests__/SpacesPage.test.tsx` → PASS. 이어 `npx vitest run`(전체), `npm run lint`, `npx tsc --noEmit`.

- [ ] **Step 5: 로컬 앱 확인** — dev 서버 `/spaces`에서 주소 검색→반경 내 공간 마커/목록 필터 동작 확인(Docker 백엔드에 좌표 있는 공간 몇 개 등록해 둘 것).

- [ ] **Step 6: Commit**

```bash
git add farmbroker-web/src/pages/spaces/
git commit -m "feat(web): 공간 목록에 주소+반경 지도 탐색 통합"
```

---

## Task 12: 프론트 — 공간 등록 시 좌표 저장

**Files:**
- Modify: `farmbroker-web/src/pages/spaces/SpaceCreatePage.tsx`

상품 `ProductFormPage`(라인 159-191)와 동일 패턴: 제출 시 주소를 지오코딩해 payload에 좌표 포함.

- [ ] **Step 1: 제출 핸들러에 지오코딩 추가**

`import { geocodeAddress } from '@/utils/geocode';` 추가. 제출 시 도로명 주소로:

```ts
let coords: { lat: number; lng: number } | null = null;
const roadAddress = address.roadAddress?.trim();
if (roadAddress) {
  coords = await geocodeAddress(roadAddress).catch(() => null);
}
// create payload에 추가:
latitude: coords?.lat ?? null,
longitude: coords?.lng ?? null,
```
(SpaceCreatePage의 실제 주소 필드명·payload 구성은 파일 확인 후 맞춘다. `SpaceLocationMap` 미리보기는 그대로 유지.)

- [ ] **Step 2: 기존 SpaceCreatePage 테스트 통과 확인**

Run: `npx vitest run src/pages/spaces/__tests__/SpaceCreatePage.test.tsx`
Expected: PASS. 지오코딩은 mock되거나 제출 경로에서 실패해도 null 폴백이라 기존 검증 흐름 불변. 필요 시 geocode mock 추가.

- [ ] **Step 3: 로컬 앱 확인** — `/spaces/new`에서 주소 선택 후 등록 → `/spaces` 지도에 마커로 뜨는지 확인.

- [ ] **Step 4: Commit**

```bash
git add farmbroker-web/src/pages/spaces/SpaceCreatePage.tsx
git commit -m "feat(web): 공간 등록 시 주소를 지오코딩해 좌표 저장"
```

---

## 최종 검증

- [ ] `VITE_KAKAO_MAP_APP_KEY= npx vitest run` (CI 조건 전체) → 전부 통과
- [ ] `npm run lint` → 통과
- [ ] `npx tsc --noEmit` → 통과
- [ ] Docker 백엔드 재빌드 후 curl: 공간 등록(좌표 포함)→목록/상세 응답에 좌표 노출 확인
- [ ] dev 서버 수동 확인: `/spaces` 주소+반경 탐색, 마커, 목록 반경 필터, `/spaces/new` 등록→마커, `/market` 회귀 없음
- [ ] (배포 후) CI에서 lint/test/build 초록 확인

## 범위 밖 (YAGNI)
- 백엔드 반경 쿼리 파라미터 / 기존 공간 좌표 백필 / 지도 클러스터링 — 설계 문서의 "범위 밖" 참조.
