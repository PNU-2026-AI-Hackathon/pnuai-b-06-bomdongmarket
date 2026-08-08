# 로컬마켓(Product) 도메인 — 설계 문서

- 작성일: 2026-08-07
- 담당: 강범수 (신규 `product` 도메인, 그린필드)
- 상태: 설계 확정 (구현 대기)
- 범위: `farmbroker/` 백엔드(주) + `farmbroker-web/` 프론트 조회 연결

---

## 1. 배경 / 목표

도심 스마트팜 생산물을 지역 소비자에게 직거래하는 **로컬마켓**. 당근마켓 스타일로 판매자가
상품을 등록/수정/삭제하고, 소비자는 목록·상세를 조회한다. 프론트에는 이미 마켓 화면
(`pages/market/*`)이 있으나 목데이터(`mockMarketItems`)로만 동작 중 → 실제 백엔드로 대체한다.

**목표**
- `product` 도메인 신설 + 상품 CRUD API
- 기존 프론트 마켓 조회(목록/상세)를 실제 API에 연결
- 생산 이력(traceability) 이벤트 저장/조회
- 하이브리드 위치: Space에서 가져오거나 직접 입력, Task 3 지도의 위치 소스

**비목표(YAGNI)**
- 주문/결제/장바구니 (프론트 '구매하기'는 로그인 유도까지만)
- 목록 페이지네이션 (배열 반환, 후속)
- 상품 등록 UI (프론트 타 인원이 이 계약 기준으로 추후 구현)

## 2. 결정사항 (브레인스토밍 확정)

> 개정(2026-08-08, PR 리뷰 반영): 판매자 자격을 **FARMER 역할 보유자로 한정**하고, 공개 목록은 **판매중(ON_SALE)·재고>0만** 노출하며, **생산자명은 입력받지 않고 판매자 닉네임으로 고정**한다. 아래 표·본문에 반영됨.

| 항목 | 결정 |
|---|---|
| 판매자 자격 | **FARMER 역할 보유자만** (매칭 수락으로 도심 농부가 된 사용자). 생산자명은 **입력받지 않고 판매자 닉네임으로 고정**(요청 필드 제거) |
| 상품↔공간 | 하이브리드 — Space에서 가져오면 `spaceId` 스냅샷 저장(느슨한 참조), 아니면 직접 입력 |
| 생산 이력 | 이벤트 타임라인 포함(stage/description/occurredAt) |
| 삭제 | 소프트 삭제(deleted 플래그) |
| 카테고리 | 잎채소 / 허브 / 과채류 (목록 '전체'=전부) |
| 위치/마일리지 | latitude·longitude·foodMileageKm는 nullable, Task 3에서 채움 |

## 3. 도메인 경계

- **신규 `product` 도메인은 강범수 소유.** `AGENT.md` 소유권 표에 반영한다.
- **Space 도메인(강민규): 변경 없음.** Product는 Space 엔티티를 참조/수정하지 않는다.
  '가져오기'로 넘어온 `spaceId`는 JPA 연관/FK 제약 없이 **단순 Long 스냅샷**으로만 보관한다.
- SecurityConfig(강범수 소유)에 상품 경로 규칙을 추가한다.

## 4. 데이터 모델

### 4.1 `Product` (table `products`)
| 필드 | 타입 | 제약/비고 |
|---|---|---|
| id | Long | PK, 응답에선 `productId` |
| seller | User @ManyToOne(LAZY, seller_id) | 등록자=인증 사용자. body의 sellerId 안 받음 |
| name | String(100) | not null |
| category | ProductCategory enum(STRING) | not null |
| price | Integer | not null (원) |
| unit | String(20) | not null (팩/묶음/봉/박스 등) |
| stock | Integer | not null (구매 없음 → 정보성) |
| imageUrl | String(500) | nullable, 단일 이미지(MVP) |
| description | TEXT | nullable |
| harvestDate | LocalDate | not null |
| producerName | String(60) | not null. **요청으로 받지 않고 등록 시 seller.nickname으로 고정**(수정 불가) |
| productionLocation | String(255) | not null (표시용 위치명) |
| address | String(255) | nullable (지도/지오코딩용) |
| latitude | Double | nullable (Task 3) |
| longitude | Double | nullable (Task 3) |
| spaceId | Long | nullable (Space 가져오기 출처 스냅샷; FK/연관 없음) |
| foodMileageKm | Double | nullable (Task 3 계산 or 판매자 입력) |
| status | ProductStatus enum(STRING) | not null, 기본 ON_SALE |
| deleted | boolean | not null, 소프트 삭제 |
| createdAt / updatedAt | LocalDateTime | JPA Auditing |

- `ProductCategory` enum: `LEAFY("잎채소")`, `HERB("허브")`, `FRUIT_VEGETABLE("과채류")`
  - API JSON의 `category`는 **한글 라벨**로 노출/입력(기존 프론트 계약 유지). 내부는 enum으로 검증.
- `ProductStatus` enum: `ON_SALE`, `CLOSED` (판매자가 마감 가능)
- 연관관계는 단방향 @ManyToOne만(팀 컨벤션). 역방향 컬렉션 두지 않음(이력 이벤트는 예외적으로 상품 소유 컬렉션).

### 4.2 `ProductTraceabilityEvent` (table `product_trace_events`)
| 필드 | 타입 | 비고 |
|---|---|---|
| id | Long | PK |
| product | @ManyToOne(LAZY, product_id) | not null |
| stage | String(40) | not null (파종/정식/수확/배송 등) |
| description | String(255) | nullable |
| occurredAt | LocalDate | not null |
| sortOrder | int | 표시 순서 |

- 상품 생성/수정 시 이벤트를 **중첩 payload**로 함께 처리(전량 교체 방식: 수정 시 기존 이벤트 삭제 후 재삽입).
- 상세 응답에 `sortOrder, occurredAt` 순으로 포함. 목록에는 미포함(경량).

### 4.3 파생 필드(저장하지 않음)
`freshnessTags`는 응답 생성 시 규칙으로 계산:
- `오늘 수확` — harvestDate == 오늘
- `이력 확인` — traceability 이벤트 1개 이상
- `근거리 농장` — foodMileageKm != null && ≤ 5.0
- `낮은 푸드 마일리지` — foodMileageKm != null && ≤ 10.0

(임계값 5/10km는 상수로 두고 튜닝 가능)

## 5. API 계약 (`/api/products`)

| 메서드 | 경로 | 인증 | 설명 |
|---|---|---|---|
| GET | /products?keyword=&category= | 공개 | 목록. keyword=상품명+생산위치 부분일치, category='전체'/미지정=전부 |
| GET | /products/{id} | 공개 | 상세(판매자 닉네임·이력 이벤트 포함) |
| GET | /products/my | 인증 | 내가 등록한 상품 |
| POST | /products | 인증 | 등록(seller=인증 사용자) |
| PATCH | /products/{id} | 인증+소유자 | 부분 수정(null 아닌 필드만), 이벤트는 전량 교체 |
| DELETE | /products/{id} | 인증+소유자 | 소프트 삭제 |

- 공개 목록은 `deleted=false` **&& status=ON_SALE && stock>0** 만. 마감/품절은 목록에서 제외한다(SpaceRepository와 동일하게 상태 필터를 건다). 배열 반환(페이지네이션 후속).
- `/products/my`(내 판매 상품)는 이 필터를 타지 않으므로 마감/품절 상품도 그대로 보인다.
- 상세(GET /products/{id})는 마감 상품도 조회 가능하되, 프론트가 `status`로 마감 뱃지를 붙이고 구매 CTA를 비활성화한다.
- 정렬: 최신순(createdAt desc).

### 5.1 요청/응답 DTO
- **ProductCreateRequest**: name, category(한글), price, unit, stock, imageUrl?, description?, harvestDate,
  productionLocation, address?, latitude?, longitude?, spaceId?, foodMileageKm?, events?[]
  (producerName은 요청 필드에 없음 — 닉네임 고정)
  - 검증: name/category/price/unit/stock/harvestDate/productionLocation 필수(@NotNull/@NotBlank/@Positive 등)
  - events[]: { stage(@NotBlank), description?, occurredAt(@NotNull), sortOrder? }
- **ProductUpdateRequest**: 위 필드 전부 optional(부분 수정). events가 오면 전량 교체.
- **ProductListItemResponse**: productId, name, category, productionLocation, producerName, harvestDate,
  price, unit, imageUrl, foodMileageKm, stock, status, freshnessTags[]
- **ProductDetailResponse**: 위 + sellerNickname, description, address, latitude, longitude, spaceId,
  createdAt, traceabilityEvents[]{ stage, description, occurredAt, sortOrder }

> 기존 프론트 `MarketItem`과 필드 호환(추가 필드는 프론트가 무시). foodMileageKm는 null 가능 → 프론트 guard 필요.

## 6. 보안 / 예외

- SecurityConfig: `GET /products`, `/products/*` permitAll. **단 `/products/my`는 와일드카드보다 먼저 authenticated 선언**(`/spaces/my`와 동일 패턴). 쓰기(POST/PATCH/DELETE)는 `anyRequest().authenticated()`로 보호.
- ErrorCode 추가: `PRODUCT_NOT_FOUND`(404), `NOT_PRODUCT_OWNER`(403).
- 소유자 검증: PATCH/DELETE는 `product.seller.id == 인증 userId` 아니면 `NOT_PRODUCT_OWNER`.

## 7. 프론트 연결 (조회)

- `services/marketService.ts`: `getMarketItems`/`getMarketItem`를 `USE_MOCKS` 분기로 실제 API 호출 추가(다른 서비스 패턴과 동일). 목 폴백 유지.
- `types/api.ts` `MarketItem`에 optional 필드 추가(spaceId?, latitude?, longitude?, status?, description?, sellerNickname?), 상세용 traceabilityEvents? 타입 추가. foodMileageKm를 nullable 허용.
- 상세 페이지: foodMileageKm null이면 마일리지 카드 숨김(guard). **이력 타임라인은 실제 `traceabilityEvents`로 렌더**하고, 이벤트가 없으면 빈 상태를 보여준다(하드코딩 단계·"N일차" 문구 제거 — 허위 이력 방지). imageUrl이 null이면 placeholder 표시(깨진 이미지 방지).
- `MarketItem.imageUrl`은 `string | null`(백엔드 nullable과 일치). 목록/상세 모두 `ProductImage` 컴포넌트로 placeholder guard.
- **등록/수정/삭제 UI는 이 계약 기준으로 타 인원이 추후 구현** — 서비스/타입에 주석으로 명시.

## 8. 프론트·Space 팀 참고(주석/이슈로 공유)

- 카테고리 값은 정확히 '잎채소'/'허브'/'과채류'.
- '작업장에서 가져오기' = `GET /spaces/my`로 내 공간 선택 → productionLocation/address/spaceId 프리필. 백엔드는 spaceId만 스냅샷 보관(Space 변경과 무관).
- 위치·마일리지는 Task 3 전까지 null 가능.
- 이미지 1장(MVP), 이력 이벤트는 중첩 배열로 함께 POST.

## 9. 테스트 계획

- 서비스: 등록 시 seller/기본 producerName, 소유자 아닌 수정/삭제 → NOT_PRODUCT_OWNER, 소프트 삭제 후 목록 제외, 이벤트 전량 교체.
- 컨트롤러(슬라이스): GET 공개 접근, 쓰기 인증 요구, `/products/my` 인증, freshnessTags 파생.
- 프론트: 기존 마켓 테스트(목 기반) 유지, 타입 변경으로 인한 회귀 없음 확인.

## 10. 커밋 계획(논리 단위)

1. docs(product): 본 스펙
2. feat(product): 엔티티·enum·이벤트·레포지토리 + ErrorCode 추가
3. feat(product): DTO·서비스·컨트롤러(CRUD) + SecurityConfig 경로
4. test(product): 서비스·컨트롤러 테스트
5. feat(web): marketService 실제 API 연결 + 타입/상세 guard
6. docs(product): AGENT.md 소유권/‏API 표 갱신

## 11. 후속(범위 밖)
- Task 3: 등록 location으로 카카오맵 표시, 주소→위경도 지오코딩, 푸드 마일리지 계산.
- 주문/결제, 목록 페이지네이션, 상품 등록 프론트 UI.
