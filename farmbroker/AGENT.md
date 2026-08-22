# AGENT.md — FarmBroker 백엔드

> 이 문서는 AI 에이전트가 **백엔드 모듈(`farmbroker/`)** 에서 작업할 때 따라야 하는 규칙과 컨텍스트입니다.
> 프론트엔드(`farmbroker-web/**`)는 [`../farmbroker-web/AGENTS.md`](../farmbroker-web/AGENTS.md), 저장소 전반 규칙은 [`../AGENTS.md`](../AGENTS.md)를 따릅니다.

---

## 1. 프로젝트 개요

**FarmBroker** — 도심 공실 소유자·도심 농부·지역 소비자를 연결하는 스마트팜 매칭 플랫폼.
공실 제공자가 스마트팜 전환 가능한 공간을 등록하면, 도심 농부가 조회 후 **수익 예측·AI 작물 추천**을 확인하고 매칭을 신청하는 흐름.
매칭 이후는 **매칭 신청 → 채팅 협의 → 계약서 작성(제공자) → 양측 동의 → 최종 계약** 한 갈래뿐이고, 진행 상태는 `matchings.status` 하나로 관리한다 (`REQUESTED`/`ACCEPTED`/`REJECTED`/`CANCELED`). 공간 제공자가 신청을 일방적으로 수락·거절하는 경로는 없다.

- **클라이언트: React 웹 SPA** (`farmbroker-web/`, Vite). → **CORS는 백엔드 책임** (아래 8번).
- **서버: Spring Boot REST API** (`farmbroker/`).
- **DB: MySQL** (로컬 개발은 `docker-compose.yml`, 포트 **3307**).
- 제7회 PNU 창의융합 AI 해커톤 출품작.

---

## 2. 기술 스택 (버전 고정 — 구버전 패턴 금지)

`build.gradle` 기준 실제 버전:

- **Java 21** (`sourceCompatibility = 21`)
- **Spring Boot 4.1.0** — starter 이름이 4에서 바뀜: `spring-boot-starter-webmvc`(구 `-web`), `-webmvc-test` 등. 신규 의존성 추가 시 이 명명 규칙을 확인할 것.
- **Spring Security 6.x** — `SecurityFilterChain` Bean 방식. `WebSecurityConfigurerAdapter`는 **제거됨, 절대 사용 금지**.
- **Spring Data JPA** + **MySQL** (`com.mysql:mysql-connector-j`)
- **JWT: jjwt 0.12.6** — 신 API (`Jwts.builder()...signWith(key)` / `Jwts.parser().verifyWith(key)`). 구 API 금지.
- **springdoc-openapi 3.0.3** — Swagger UI (`/swagger-ui.html`, `/v3/api-docs`).
- **Lombok**, **jakarta.validation** (Bean Validation), **jakarta.\*** (`javax.*` 금지).
- 빌드: **Gradle** (Wrapper 포함).

비밀번호는 **BCryptPasswordEncoder** 해싱 저장 (`common.config.PasswordEncoderConfig`). 평문 저장·로그·응답 노출 금지.

---

## 3. 모듈 구조 & 도메인 소유권

패키지 루트: `com.farmbroker.farmbroker`. 현재 백엔드 전체가 구현되어 있으며, 담당자별 소유 경계는 아래와 같다.

| 패키지 | 내용 | 소유 |
|--------|------|------|
| `common` | `response.ApiResponse`, `exception.*`, `config.*`(Cors 없음—Security에서 처리, JpaAuditing, OpenAPI, PasswordEncoder) | 강범수 (백엔드 1) |
| `security` | `JwtTokenProvider`, `JwtAuthenticationFilter`, `SecurityConfig` | 강범수 (백엔드 1) |
| `auth` | 회원가입·로그인·로그아웃 | 강범수 (백엔드 1) |
| `user` | `User`, `UserRole`, `UserRoleSetConverter`, 내 정보 조회 | 강범수 (백엔드 1) |
| `space` | 공간 CRUD, 소유자 권한, 상태 관리 | 강민규 |
| `matching` | 매칭 신청, 계약서 협의·동의, 공간 계약 연동 | 백엔드 3 |
| `ai` | Gemini 기반 작물 추천 (`GeminiClient`, 프롬프트 빌더) | 백엔드 3 |
| `crop` | 작물 백과사전 (초기 데이터 시딩 포함) | 백엔드 3 |
| `profit` | 수익 예측 계산기 (CSV 기준데이터 기반) | 비전공자 로직 이관 |
| `product` | 로컬마켓 상품 CRUD, 생산 이력, 하이브리드 Space 참조(spaceId 스냅샷) | 강범수 (백엔드 1) |

> **공용 계약**(`ApiResponse`, `ErrorCode`, `BusinessException`, `SecurityConfig`)은 모든 도메인이 의존한다. 필드명·구조를 임의로 바꾸면 타 도메인 코드가 깨지므로 신중히 변경하고, 변경 시 영향 범위를 명시할 것.
> 특정 도메인 작업 요청이 아니면 **소유 경계를 넘는 수정은 하지 말 것.**

---

## 4. 공통 응답 형식 (`common.response.ApiResponse<T>`)

모든 컨트롤러는 raw DTO/엔티티를 직접 반환하지 않고 `ApiResponse<T>`로 감싼다. (`@JsonInclude(NON_NULL)` — null 필드는 직렬화 제외)

**성공**
```json
{ "success": true, "message": "요청이 성공했습니다.", "data": {} }
```
**에러**
```json
{ "success": false, "message": "에러 메시지", "errorCode": "ERROR_CODE" }
```

정적 팩토리만 사용: `ApiResponse.success(message, data)`, `ApiResponse.error(message, errorCode)`.

---

## 5. 예외 처리 (`common.exception`)

- `ErrorCode` (enum): `HttpStatus` + 기본 메시지 보유. 도메인별 코드를 이 enum에 누적 추가한다 (auth/user, space, matching, ai, crop 코드가 이미 존재).
- `BusinessException(ErrorCode)`: 비즈니스 예외는 이걸로 던진다.
- `GlobalExceptionHandler` (`@RestControllerAdvice`):
  - `BusinessException` → 해당 status + `ApiResponse.error`
  - `MethodArgumentNotValidException` → 400 `VALIDATION_ERROR`
  - `Exception` → 500 `INTERNAL_ERROR`

인증 실패(토큰 없음/만료)는 필터 단계에서 `SecurityConfig`의 `authenticationEntryPoint`가 401 `UNAUTHORIZED` JSON을 직접 반환한다.

---

## 6. Security / JWT (`security`)

- 방식: **JWT Access Token** (Refresh Token 없음). 전송은 **httpOnly 쿠키**(로그인 시 `Set-Cookie` 발급) 우선, `Authorization: Bearer` 헤더는 폴백(curl·Swagger). same-site + `SameSite=Lax`로 CSRF 방어. 쿠키 속성은 `jwt.cookie.*` env로 토글(운영 HTTPS는 `JWT_COOKIE_SECURE=true`). 상세: `docs/specs/2026-08-06-jwt-httponly-cookie-design.md`.
- **`JwtTokenProvider`**: `subject = userId` 만 담는다. **role은 claim에 넣지 않는다.**
  - 이유: 역할이 활동에 따라 누적되는 가변 값이라, 토큰에 박으면 발급 직후부터 실제 값과 어긋난다. **권한 판단은 매 요청마다 DB의 `User`를 읽어서** 한다.
  - `secret`/`expiration`은 `application.yml`(→ 환경변수)에서 주입. 하드코딩 금지.
- **`AuthCookieProvider`**: 인증 쿠키 발급/삭제(만료)/추출 담당. 속성은 `application.yml`에서 주입.
- **`JwtAuthenticationFilter`**: `OncePerRequestFilter`. **쿠키 우선, 헤더 폴백**으로 토큰 추출 → 검증 → `SecurityContext`에 인증 세팅.
- **`SecurityConfig`** (Spring Security 6):
  - `csrf.disable()`, 세션 `STATELESS`, `JwtAuthenticationFilter`를 `UsernamePasswordAuthenticationFilter` 앞에 삽입.
  - `PasswordEncoder` = `BCryptPasswordEncoder` (`common.config.PasswordEncoderConfig`).
  - **permitAll**: `POST /auth/signup`, `POST /auth/login`, `GET /crops`·`/crops/**`, `GET /spaces`·`/spaces/*`, `GET /products`·`/products/*`, Swagger 경로.
  - **authenticated**: `GET /spaces/my`·`GET /products/my`(⚠️ 각각 `/spaces/*`·`/products/*` 와일드카드보다 **먼저** 선언되어야 열리지 않음), 그 외 `anyRequest()`.
  - 세부 권한(OWNER만 등록 등)은 각 도메인 서비스에서 처리.

---

## 7. User 도메인 (⚠️ 멀티 역할 — CLAUDE.md 시절과 달라진 핵심)

`user.domain.User` (JPA `@Entity`, table `users`)

| 필드 | 타입 | 비고 |
|------|------|------|
| `id` | Long | PK (응답에서는 `userId`로 노출) |
| `email` | String | unique, not null |
| `password` | String | not null (BCrypt 해시) |
| `nickname` | String | not null |
| `roles` | `Set<UserRole>` | not null. **단일 값이 아니라 집합** |
| `createdAt` | LocalDateTime | `@CreatedDate` (JpaAuditing) |

- **`UserRole`**: `OWNER`, `FARMER`, `CONSUMER`. **한 회원이 여러 역할 동시 보유 가능.**
- 역할은 가입 시 고르는 게 아니라 **활동에 따라 누적**: 가입 시 `CONSUMER`로 시작 → 공간 등록 시 `OWNER` 추가 → 계약 확정(양측 동의) 시 `FARMER` 추가 (`User.addRole`).
- DB 저장: `users.role` **한 컬럼에 콤마로 이어 붙여** 저장 (`UserRoleSetConverter`). `@Enumerated`와 `@Convert`는 병행 불가라 `@Convert`만 사용.
- `UserRole` enum 선언 순서가 직렬화 순서 = 새 역할은 **뒤에 추가**할 것 (중간 삽입 시 기존 행 문자열과 어긋나 무의미한 UPDATE 발생).
- `addRole`은 컬렉션을 제자리 수정하지 않고 새 `EnumSet`으로 교체 (더티 체킹 누락 방지).

---

## 8. CORS (웹 프론트 필수 — `SecurityConfig`에서 처리)

- 허용 Origin: `http://localhost:5173`(Vite), `http://localhost:3000`(CRA)
- 허용 메서드: `GET, POST, PATCH, DELETE, OPTIONS`
- 허용 헤더: `Authorization, Content-Type`
- `allowCredentials(true)` → Origin에 `*` 금지, 명시적 지정.

---

## 9. API 표면 (현재 구현 기준)

context-path `/api` 접두 (예: `http://localhost:8080/api/auth/signup`). 컨트롤러 매핑은 context-path를 제외한 경로로 작성.

| 도메인 | 메서드 · 경로 | 인증 |
|--------|----------------|------|
| auth | `POST /auth/signup`, `POST /auth/login` | ✕ |
| auth | `POST /auth/logout` | ✓ |
| user | `GET /users/me` | ✓ |
| space | `POST /spaces` / `GET /spaces` / `GET /spaces/my` / `GET /spaces/{id}` / `PATCH /spaces/{id}` / `DELETE /spaces/{id}` | 목록·상세 ✕, 그 외 ✓ |
| matching | `POST /matchings` / `GET /matchings/my-requests?spaceId=` / `GET /matchings/received` / `GET /matchings/sent` / `PATCH /matchings/{id}/cancel` / `PATCH /matchings/{id}/dismiss` | ✓ |
| matching(계약서) | `GET /matchings/{id}/contract` / `PATCH /matchings/{id}/contract` / `PATCH /matchings/{id}/contract/agree` / `PATCH /matchings/{id}/contract/cancel` | ✓ |
| ai | `POST /ai/recommend` | ✓ |
| crop | `GET /crops` / `GET /crops/{cropId}` | ✕ |
| product | `GET /products` / `GET /products/{id}` / `GET /products/my` / `POST /products` / `PATCH /products/{id}` / `DELETE /products/{id}` | 목록·상세 ✕, 그 외 ✓ |

### 대표 계약 (강범수 소유 3종)

**`POST /auth/signup`** — `email`(@Email @NotBlank), `password`(@NotBlank @Size(min=8)), `nickname`(@NotBlank). 이메일 중복 시 `DUPLICATE_EMAIL`, BCrypt 해싱 후 저장. 신규 가입은 `CONSUMER`로 시작.
```json
{ "success": true, "message": "회원가입이 완료되었습니다.",
  "data": { "userId": 1, "email": "owner@example.com", "nickname": "닉네임", "roles": ["CONSUMER"] } }
```

**`POST /auth/login`** — 이메일 조회 → 비번 매칭(실패 시 `INVALID_CREDENTIALS`) → JWT를 **httpOnly 쿠키(`Set-Cookie`)로 발급**. 본문에는 토큰을 넣지 않고 user만 반환.
```json
{ "success": true, "message": "로그인에 성공했습니다.",
  "data": { "user": { "userId": 1, "email": "...", "nickname": "...", "roles": ["CONSUMER"] } } }
```

**`GET /users/me`** — 토큰에서 userId 추출 → 조회(없으면 `USER_NOT_FOUND`).

> 타 도메인(space/matching/ai/crop)의 상세 요청/응답 스펙은 각 `dto` 패키지와 컨트롤러의 Swagger 애노테이션을 참조.

---

## 10. 설정 (`application.yml`)

- `spring.config.import`: `optional:file:.env` 및 `optional:file:../.env` 를 읽어 환경변수 주입.
- `server.servlet.context-path: /api` (`SERVER_CONTEXT_PATH`)
- DB: `DB_URL`(기본 `jdbc:mysql://localhost:3307/farmbroker`), `DB_USERNAME`, `DB_PASSWORD`
- JPA: `ddl-auto`(기본 `update`), `open-in-view: false`, `show-sql`(기본 false)
- JWT: `jwt.secret`(`JWT_SECRET`), `jwt.expiration`(`JWT_EXPIRATION`, 기본 86400000=1일)
- Gemini: `GEMINI_API_KEY`, `GEMINI_MODEL`(기본 `gemini-2.5-flash`), `GEMINI_BASE_URL`

민감 값(시크릿/DB 비번/API 키)은 하드코딩 금지 — `.env` 또는 환경변수로 주입 (`../.env.example` 참고).

---

## 11. 명령어

```bash
./gradlew build          # 빌드
./gradlew bootRun        # 로컬 실행 (http://localhost:8080/api)
./gradlew test           # 테스트
docker compose up -d     # (레포 루트) MySQL 등 로컬 인프라
```

> ⚠️ **로컬 환경 주의:** 저장소 경로에 한글이 포함되어 있어 로컬 `gradlew test`가 `ClassNotFoundException`으로 실패할 수 있다(컴파일·CI는 정상). 필요 시 ASCII 경로로 복사해 실행. 로컬 API 테스트 시 샌드박스 프록시 회피를 위해 `curl --noproxy "*" http://127.0.0.1:8080/...` 형태를 사용.

---

## 12. 코딩 컨벤션

- 컨트롤러는 얇게, 비즈니스 로직은 서비스로. 컨트롤러는 항상 `ApiResponse<T>` 반환, 엔티티→DTO 변환 필수 (raw 엔티티 반환 금지).
- 요청 DTO는 `jakarta.validation`으로 검증, 컨트롤러 파라미터에 `@Valid`.
- 예외는 `BusinessException(ErrorCode)`로 던지고 전역 핸들러가 응답 변환.
- 비밀번호 등 민감정보는 로그·응답에 노출 금지.
- Lombok 사용하되 엔티티에 `@Setter` 남발 금지 — `@Builder`/생성자 활용, `@NoArgsConstructor(PROTECTED)`.
- 커밋 메시지는 [`../docs/commit-strategy.md`](../docs/commit-strategy.md) 형식(`<type>(<scope>): <summary>`)을 따른다.

---

## 13. 하지 말 것 (체크리스트)

- ❌ `WebSecurityConfigurerAdapter` (Security 6에서 제거)
- ❌ `javax.*` import (Boot 4는 `jakarta.*`)
- ❌ 비밀번호 평문 저장 / 응답·로그에 password 포함
- ❌ JWT secret·DB 비번·API 키 하드코딩
- ❌ JWT claim에 role 저장 (권한은 DB 조회로 판단)
- ❌ 컨트롤러에서 엔티티 직접 반환
- ❌ 공용 계약(`ApiResponse`/`ErrorCode`/`SecurityConfig`) 임의 구조 변경
- ❌ 요청받지 않은 타 도메인 소유 코드 수정
- ❌ CORS 미설정 (웹 프론트 연동 깨짐)
