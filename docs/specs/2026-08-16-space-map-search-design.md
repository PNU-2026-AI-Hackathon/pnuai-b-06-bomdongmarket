# 공간 지도 탐색 기능 설계

작성일: 2026-08-16
브랜치: `feature/space-map-search`

## 목표

로컬 마켓 페이지처럼, 공간(spaces) 목록 페이지에서 **주소를 입력하면 그 주변의 공실 공간을 지도 마커로 탐색**할 수 있게 한다. 마켓과 동일한 UX(주소 입력 + 반경 선택 → 지도 마커 + 반경 내 목록 필터)를 제공한다.

## 배경 / 현재 상태

- **마켓(구현됨):** `MarketPage`에 `MarketMap`(다중 마커 + 반경 원) + `MarketMapSearch`(주소/반경) + `useNearbyItems`(반경 필터 + 폴백 지오코딩). 상품 엔티티는 `latitude/longitude`를 저장하고, 프론트 등록 폼(`ProductFormPage`)이 주소를 클라이언트 지오코딩해 좌표를 함께 전송한다.
- **공간(현재):** `SpacesPage`는 리스트 + 필터(`SpaceFilter`: 면적/월세/정렬)뿐 지도가 없다. `SpaceLocationMap`은 **등록 폼에서 입력 주소 1곳만** 미리보기하는 단일 지도이며, 좌표는 미리보기 용도로만 쓰고 서버엔 주소 문자열만 보낸다. `Space` 엔티티/DTO에는 `latitude/longitude`가 **없다**.

## 확정된 결정 (브레인스토밍)

1. **백엔드에 공간 좌표 저장** (상품 패턴 미러링). 프론트 지오코딩 결과를 등록/수정 시 저장.
2. **기존/레거시 공간(좌표 null)은 프론트 폴백 지오코딩**으로 처리 — 마켓과 동일. 좌표 있으면 그걸 쓰고, 없으면 프론트가 address를 지오코딩해 마커 표시. 백엔드 백필 불필요.
3. **반경이 아래 목록까지 필터링** — 반경 내 공간만 지도 마커 + 카드 목록에 표시. 기존 면적/월세/정렬 필터와 **AND 결합**.
4. **프론트 지도 컴포넌트는 공용 제네릭화** — `useNearbyItems`/`MarketMap`/`MarketMapSearch`를 엔티티 무관 제네릭으로 승격해 마켓·공간이 공유.

## 설계

### 1. 백엔드 — Space 좌표 저장

상품(`Product`)이 밟은 경로를 그대로 미러링한다.

- **`Space` 엔티티**: `Double latitude`, `Double longitude` (nullable) 컬럼 추가. `@Column`(nullable), Builder·생성자·update 로직에 반영. `ddl-auto=update`가 컬럼을 자동 생성한다.
- **`SpaceCreateRequest`**: `Double latitude`, `Double longitude` 선택 필드 추가. 필수 아님(지오코딩 실패 시 null 허용). 값이 있으면 위도 -90~90 / 경도 -180~180 범위 검증.
- **`SpaceUpdateRequest`**: 동일 좌표 필드 추가(수정으로 좌표 갱신 가능).
- **`SpaceService.create` / `update`**: 요청 좌표를 엔티티에 통과 저장(`ProductService`와 동일 패턴).
- **응답 DTO**: `SpaceListItemResponse`(목록 지도가 목록 응답의 좌표를 읽으므로 **필수**) + `SpaceDetailResponse`에 `latitude/longitude` 노출. `SpaceSummaryDto`도 확인해 계약 정렬.
- **기존 데이터**: 좌표 `null`로 남으며 프론트 폴백이 처리한다.

### 2. 프론트 타입 (`src/types/api.ts`)

- `SpaceSummary`(및 목록 응답 매핑)에 `latitude?: number | null`, `longitude?: number | null` 추가.
- `SpaceCreateInput` / `SpaceUpdateInput`에 좌표 필드 추가.

### 3. 프론트 — 공용 제네릭 지도 (핵심 리팩터)

신규 위치 `src/components/map/`:

- **`useNearbyPlaces<T>(items, center, radiusKm, adapter)`**
  - `adapter = { getId(item) => number, getDirectCoords(item) => Coords | null, getAddress(item) => string | null, getTitle(item) => string }`
  - 현재 `useNearbyItems` 로직을 제네릭화: 직접 좌표 우선, 없으면 address 폴백 지오코딩(항목별 실패 삼킴), 반경 내 항목을 거리 오름차순 정렬.
  - 반환 `{ mapItems, visibleItems, distances }` (기존과 동일 구조, id 키는 제네릭).
- **`NearbyMap<T>`**
  - 현재 `MarketMap` 렌더 로직(마커/반경 원/Kakao 생명주기: 지도 1회 생성, center 이동, redraw) 제네릭화.
  - props: `center, radiusKm, items(mapItems), selectedId, onSelect(id), getTitle(item)`.
- **`NearbyMapSearch`**
  - 현재 `MarketMapSearch`(주소 입력 + 반경 셀렉트 + 지오코딩)를 엔티티 무관 공용으로 승격. `constants/geo`(RADIUS_OPTIONS_KM, DEFAULT_MAP_CENTER, DEFAULT_RADIUS_KM) 재사용.

**마켓 리팩터:** `MarketPage`가 새 제네릭(`useNearbyPlaces` + `NearbyMap` + `NearbyMapSearch`)을 **상품 어댑터**와 함께 사용. 기존 `pages/market/components/MarketMap.tsx`, `MarketMapSearch.tsx`, `hooks/useNearbyItems.ts`는 제거하고, 관련 테스트를 제네릭 컴포넌트 기준으로 이관해 회귀를 보증한다.

### 4. 프론트 — 공간 페이지 통합 (`SpacesPage`)

- 마켓과 동일하게 지도 카드 추가: `NearbyMapSearch` + `NearbyMap`(**공간 어댑터**: `getId=spaceId, getTitle=title, getDirectCoords=lat/lng, getAddress=address`).
- `useSpaces` 결과 items를 `useNearbyPlaces`에 통과. `mapSupported`(앱키 존재)면 목록 = **반경 내 공간(visibleItems)**, 기존 `SpaceFilter`(면적/월세/정렬)와 AND 결합. 앱키 없으면 지도 숨기고 서버 목록 그대로.
- **`SpaceCard`**: 거리(distanceKm) 표시 prop 추가(마켓 `ProductCard` 방식). 마커 클릭 → 해당 카드로 스크롤 + 하이라이트(마켓 `handleSelect` 동일).

### 5. 등록 폼 좌표 캡처 (`SpaceCreatePage`)

- 상품 `ProductFormPage`와 동일하게, 폼 제출 시 `geocodeAddress(도로명주소)`를 호출해 좌표를 create payload(`SpaceCreateInput.latitude/longitude`)에 포함. 실패 시 null(안전 폴백).
- 기존 `SpaceLocationMap` 미리보기는 그대로 유지(입력 주소 확인용).

### 6. 에러 처리

- **지오코딩 실패**: 좌표 null 저장 → 목록 지도의 폴백이 재시도(상품과 동일).
- **Kakao 앱키 없음**: 지도/검색 숨기고 목록만(`hasKakaoMapKey` 가드 유지). 마켓과 동일 문구.
- **백엔드**: 좌표는 선택값, 범위 위반 시 검증 에러(VALIDATION_ERROR).

### 7. 테스트

- **백엔드**: `SpaceService` create/update가 좌표를 저장하는지, 응답 DTO(`SpaceListItemResponse`/`SpaceDetailResponse`)에 좌표가 포함되는지 단위테스트.
- **프론트**:
  - `useNearbyPlaces` 제네릭 테스트(기존 `useNearbyItems` 테스트를 어댑터 기반으로 이관 + 공간 케이스).
  - `NearbyMap` 스모크(마커 개수/반경 원).
  - `SpacesPage` — 반경 필터 × 기존 필터(면적/월세) AND 결합 동작.
  - 마켓 회귀: 기존 `MarketPage`/맵 테스트가 제네릭 이관 후에도 통과.

## 컴포넌트 경계 요약

| 유닛 | 역할 | 의존 |
|---|---|---|
| `useNearbyPlaces<T>` | 반경 필터 + 폴백 지오코딩 (엔티티 무관) | `utils/geocode`, `kakaoSdk`, adapter |
| `NearbyMap<T>` | Kakao 지도 렌더(마커/반경 원) | `kakaoSdk`, adapter/props |
| `NearbyMapSearch` | 주소 입력 + 반경 선택 → center/radius emit | `geocode`, `constants/geo` |
| 마켓 어댑터 (MarketPage 내) | 상품 → 공용 계약 매핑 | — |
| 공간 어댑터 (SpacesPage 내) | 공간 → 공용 계약 매핑 | — |
| 백엔드 Space 좌표 | 등록/수정 시 좌표 저장·응답 노출 | 상품 패턴 |

## 범위 밖 (YAGNI)

- 백엔드 반경 쿼리(공간 검색 API에 위경도/반경 파라미터) — 프론트 클라이언트 필터로 충분.
- 기존 공간 좌표 일괄 백필 마이그레이션 — 프론트 폴백으로 대체.
- 지도 클러스터링/성능 최적화 — 데이터 규모상 불필요.
- 공간 상세 페이지 지도(이미 `SpaceLocationMap` 유사 패턴 존재 시 별도).
