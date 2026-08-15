# 로컬마켓 지도 검색 — 설계 문서

- 작성일: 2026-08-16
- 담당: 강범수 (`product` 도메인 소유자)
- 상태: 설계 확정 (구현 대기)
- 범위: `farmbroker-web/`(주) + `farmbroker/` 백엔드 목록 DTO 1건
- 선행: [`2026-08-07-local-market-product-design.md`](2026-08-07-local-market-product-design.md)의 "후속 — Task 3(지도)"

---

## 1. 배경 / 목표

로컬마켓(`pages/market/*`)에 **지도 기반 검색**을 추가한다. 소비자가 주소를 입력하고
반경(km)을 고르면, 그 주변에서 판매 중인 상품이 지도에 마커로 표시되고, 마커를 누르면
상품 정보를 볼 수 있다. 공간등록(`SpaceLocationMap`)의 단일 마커 지도를 **다중 마커 + 반경
검색**으로 확장한다.

선행 스펙에서 예고한 "Task 3: 등록 location으로 카카오맵 표시, 주소→위경도 지오코딩"의 구현이다.
마켓 페이지에는 이미 정적 "부산 반경 8km 이내" 카드가 자리표시로 있으며, 이를 실제 기능으로 대체한다.

**목표**
- 마켓 페이지에 주소 검색 + 반경 셀렉터 + 다중 마커 지도 추가
- 지도와 상품 그리드가 **같은 반경 결과를 공유** (상단 지도 / 하단 그리드)
- 마커 클릭 시 상품 요약 오버레이 + 상세 링크
- 상품 등록 시 주소를 지오코딩해 좌표를 저장(하이브리드 전략)

**비목표 (YAGNI)**
- 공간(Space)·기타 도메인은 지도에 올리지 않는다. **상품(Product)만.**
- 서버측 반경 쿼리(`?lat=&lng=&radiusKm=`)·서버측 지오코딩 — 도입하지 않는다(프론트 haversine).
- 브라우저 현재위치(Geolocation) 기반 중심 — 후속. 이번엔 주소 입력 기반만.
- 푸드 마일리지 자동 계산/저장 — 별개 개념(기존 `foodMileageKm` 필드는 손대지 않음).
- 마커 클러스터링·페이지네이션 — 후속.

## 2. 결정사항 (브레인스토밍 확정)

| 항목 | 결정 |
|---|---|
| 지도 대상 | **상품(Product)만** (로컬마켓 취지) |
| 좌표 확보 | **하이브리드** — 등록 시 프론트가 카카오 지오코딩해 lat/lng 저장, 조회 시 서버가 내려줌 |
| 반경 필터 | **프론트 haversine** (서버 쿼리 아님) |
| 레거시/시드(좌표 null) | 조회 시 **주소로 즉석 지오코딩 폴백**(결과 캐시). 주소도 없으면 지도에서 제외 |
| UI 배치 | **상단 지도 + 하단 그리드**, 반경 결과 공유 |
| 기본 중심 / 반경 | **부산시청(35.1798, 129.0750) / 5km** |
| 좌표·주소 없는 상품 | 지도엔 미표시, **그리드에는 계속 노출**(반경으로 숨기지 않음) |

## 3. 아키텍처 개요

```
[상품 등록/수정] 주소 입력 → (프론트) 카카오 지오코딩 → lat/lng 함께 POST/PATCH → DB 저장
[마켓 조회]      GET /products (lat/lng/address 포함)
                 → (프론트) 중심좌표 + 반경 → haversine 필터·거리정렬
                 → 상단 지도 마커 + 하단 그리드 (동일 집합)
```

**근거:** 등록은 드물고 조회는 잦다. 지오코딩을 등록 시 1회로 몰아 조회 성능과 카카오 API
쿼터를 아낀다. 좌표가 없는 레거시 상품만 조회 시 즉석 지오코딩하고 결과를 캐시한다.

## 4. 변경 범위

### 4.1 백엔드 (최소)
- **`product/dto/ProductListItemResponse.java`**: `latitude`, `longitude`, `address` 3필드 추가 +
  생성자에서 `product`로부터 매핑. **그 외 백엔드 무변경**
  — `ProductCreateRequest`/`ProductUpdateRequest`는 이미 `latitude/longitude/address`를 받고,
  `ProductService`는 이미 저장한다. `ProductDetailResponse`에도 이미 존재한다.

### 4.2 프론트 신규
| 파일 | 역할 |
|---|---|
| `utils/geocode.ts` | `geocodeAddress(address): Promise<Coords \| null>` (카카오 Geocoder 래핑 + 인메모리 캐시), `haversineKm(a, b): number` 순수 함수 |
| `pages/market/components/MarketMap.tsx` | 다중 마커 지도 — 반경 원 + 마커 + 클릭 시 정보 오버레이. `SpaceLocationMap`의 SDK 로더·로딩/에러/`cancelled` 가드 패턴 재사용 |
| `pages/market/components/MarketMapSearch.tsx` | 주소 검색창 + 반경 셀렉터(1/3/5/10km) |
| `pages/market/hooks/useNearbyItems.ts` | 아이템 좌표 해석(저장값 우선, 없으면 폴백 지오코딩) + 중심/반경 기준 필터·거리정렬 |

### 4.3 프론트 수정
- **`MarketPage.tsx`**: 정적 "부산 반경 8km" 카드 → 실제 `MarketMapSearch` + `MarketMap`으로 교체.
  중심/반경 상태 보유, `useNearbyItems` 결과를 지도와 그리드가 공유. 키워드·카테고리는 그 위에 AND 합성.
- **`ProductFormPage.tsx`**: 제출 전 `address`를 지오코딩해 `latitude/longitude`를 payload에 포함.
  기존 "위경도…는 지도 연동(Task 3)에서 서버가 채우므로 이 폼에서 받지 않습니다" 주석 갱신.
  주소가 비었거나 지오코딩 실패 시 좌표 없이 저장(등록은 막지 않음).
- **`types/api.ts`**: `MarketItem`의 lat/lng가 목록에서도 채워짐(이미 optional 필드 존재, 타입 변경 없음/주석만).
- **`services/marketService.ts`**: mock `toMockProduct`가 입력 좌표를 반영(데모용). 실서버 경로는 무변경.

## 5. 데이터 흐름 & 상호작용

1. **초기 진입:** 중심 = 부산시청 기본 좌표, 반경 5km. 지도에 반경 내 마커 + 반경 원, 그리드도 동일 집합(거리 오름차순).
2. **주소 검색:** 검색창 입력 → 지오코딩 → 중심 이동 → 마커·그리드·거리정렬 재계산.
3. **반경 변경:** 셀렉터로 즉시 재필터.
4. **마커 클릭:** 정보 오버레이(상품명 · 가격/단위 · 중심에서 N.Nkm · "상세보기" → `/market/:productId`).
   동시에 하단 그리드의 해당 카드 강조/스크롤.
5. **키워드·카테고리:** 기존 그대로, 반경 필터 위에 **AND** 합성.

## 6. 엣지 케이스 & 에러 처리

- **카카오 앱키 없음(`hasKakaoMapKey()===false`):** 지도는 `SpaceLocationMap`처럼 안내 문구로 대체,
  그리드는 전체 노출(반경 필터 비활성). 앱키는 `.env`의 `VITE_KAKAO_MAP_APP_KEY`에 이미 존재.
- **좌표·주소 둘 다 없는 상품:** 지도 제외, **그리드에는 유지**(반경으로 숨기지 않음).
- **중심 주소 지오코딩 실패:** 에러 문구 표시, 직전 중심/결과 유지.
- **동시 검색 경합:** `SpaceLocationMap`과 동일한 `cancelled` 가드로 늦게 온 콜백 폐기.
- **지오코딩 캐시:** 동일 주소 반복 지오코딩 방지(인메모리 Map). 실패는 캐시하지 않음.

## 7. 테스트 계획

- **`haversineKm`**: 알려진 두 좌표 간 거리(부산시청↔해운대 등) 오차 허용 범위 내.
- **`geocodeAddress`**: 캐시 히트 시 SDK 재호출 없음(기존 `test/kakaoSdkMock.ts` 활용), 실패 시 null.
- **`useNearbyItems`**: 저장 좌표 우선/폴백 지오코딩, 반경 밖 제외, 좌표 없는 상품은 그리드 잔존, 거리정렬.
- **`MarketMap`**: 반경 내 아이템 수 = 마커 수(jsdom + 카카오 목).
- **`MarketPage`**: 반경/주소 변경 시 그리드 필터링 회귀, 기존 키워드·카테고리 테스트 유지.
- **`ProductFormPage`**: 제출 시 지오코딩된 lat/lng가 payload에 포함, 주소 없으면 좌표 없이 제출.

## 8. 커밋 계획 (논리 단위)

1. `docs(market): 지도 검색 설계 문서` (본 문서)
2. `feat(product): 목록 응답에 latitude/longitude/address 추가` (백엔드)
3. `feat(web): 지오코딩·haversine 유틸 + 테스트`
4. `feat(web): MarketMap·MarketMapSearch·useNearbyItems 컴포넌트`
5. `feat(web): 마켓 페이지에 지도 검색 통합, 정적 카드 대체`
6. `feat(web): 상품 등록 시 주소 지오코딩해 좌표 저장`

## 9. 후속 (범위 밖)
- 브라우저 현재위치 기반 중심, 마커 클러스터링, 서버측 반경 쿼리(데이터 증가 시).
- 공간(Space) 지도 통합(별도 화면), 푸드 마일리지 자동 계산.
