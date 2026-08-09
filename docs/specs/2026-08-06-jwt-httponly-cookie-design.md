# JWT를 httpOnly 쿠키로 이전 — 설계 문서

- 작성일: 2026-08-06
- 담당: 강범수 (백엔드 1 — security / auth)
- 상태: 설계 확정 (구현 대기)
- 범위: `farmbroker/` 백엔드 + `farmbroker-web/` 프론트 (한 몸으로 함께 변경)

---

## 1. 배경 / 문제

현재 로그인 시 발급한 JWT Access Token을 프론트가 `window.sessionStorage`에 저장하고, 매 요청에 `Authorization: Bearer {token}` 헤더로 전송한다. 백엔드 `JwtAuthenticationFilter`는 이 헤더에서 토큰을 읽는다.

- 문제: `sessionStorage`에 있는 토큰은 **JS에서 읽힌다 → XSS 발생 시 토큰이 탈취**된다.
- 목표: 토큰을 **httpOnly 쿠키**로 옮겨 JS 접근을 차단(XSS로 저장 토큰 탈취 불가)하고, 브라우저가 자동 전송하게 한다.

## 2. 목표 / 비목표

**목표**
- Access Token 저장·전송을 httpOnly 쿠키로 전환.
- 로그인/로그아웃 시 서버가 쿠키를 발급/만료.
- 프론트는 토큰을 직접 다루지 않는다(`credentials: 'include'`만).
- 새로고침/탭 재오픈에도 쿠키 수명(1일)과 정확히 일치하는 로그인 상태 복원.

**비목표 (YAGNI — 이번 범위 아님)**
- Refresh Token 도입.
- 서버측 토큰 블랙리스트/무효화.
- Cross-site 배포 대응(별도 CSRF 토큰). → 아래 "9. 향후" 참고.

## 3. 핵심 결정

| 항목 | 결정 | 이유 |
|---|---|---|
| 저장 위치 | httpOnly 쿠키 | XSS로 저장 토큰 탈취 불가 |
| 배포 토폴로지 | **same-site** 가정 (개발 localhost, 운영 동일 도메인/서브도메인) | 사용자 결정 |
| CSRF 방어 | `SameSite=Lax` 쿠키 (별도 CSRF 토큰 없음) | same-site면 Lax만으로 cross-site 요청 차단, YAGNI |
| dev/prod 차이 | 쿠키 속성을 env로 토글 | dev(http)는 Secure off, prod(https)는 Secure on |
| 헤더 폴백 | `Authorization` 헤더 폴백 유지 | curl 등 도구 테스트 편의 (프론트는 사용 안 함) |
| 세션 복원 | 부팅 시 `GET /users/me` 호출 (옵션 A) | 쿠키 수명과 UI 로그인 상태 정확히 일치 |

## 4. 쿠키 스펙

| 속성 | 값 |
|---|---|
| name | `accessToken` |
| value | JWT (기존 `JwtTokenProvider.generateToken`) |
| httpOnly | `true` |
| secure | env `JWT_COOKIE_SECURE` (dev `false` / prod `true`) |
| sameSite | `Lax` (env `JWT_COOKIE_SAMESITE`로 조정 가능) |
| path | `/` |
| maxAge | `jwt.expiration`(ms) → 초로 환산 = 86400s (1일) |
| domain | 미설정(host-only). 필요 시 env로 확장 |

- 발급: 로그인 성공 시 위 속성으로 `Set-Cookie`.
- 만료: 로그아웃 시 같은 name/path에 `maxAge=0` `Set-Cookie`.
- 구현: Spring `ResponseCookie`(SameSite 속성 지원)를 사용.

## 5. 백엔드 변경

### 5.1 신규: 쿠키 유틸 (`security`)
- 예: `security/AuthCookieProvider.java`
- 책임: 설정값(name/secure/sameSite/maxAge)을 주입받아 **발급용 쿠키**와 **삭제용 쿠키(maxAge=0)** `ResponseCookie`를 생성.
- 서블릿 응답에 직접 접근하지 않고 `ResponseCookie`만 반환 → 컨트롤러가 헤더에 실어 보낸다.

### 5.2 `JwtAuthenticationFilter` (수정)
- `resolveToken`을 **쿠키 우선 → 헤더 폴백** 순으로 변경.
  - 요청 쿠키 중 name==`accessToken` 값을 먼저 확인.
  - 없으면 기존 `Authorization: Bearer` 파싱.
- 나머지 검증/`SecurityContext` 세팅 로직은 그대로.

### 5.3 `auth` (수정)
- `AuthService.login`은 **토큰 문자열과 사용자 정보를 함께** 컨트롤러에 돌려준다(서블릿/쿠키 관심사는 컨트롤러가 담당).
  - 예: 내부 반환형 `LoginResult(String accessToken, LoginResponse body)` (명칭은 구현 시 확정).
- `AuthController.login`
  - `AuthCookieProvider`로 발급 쿠키를 만들어 응답 `Set-Cookie` 헤더에 추가.
  - 본문은 `ApiResponse.success("로그인에 성공했습니다.", body)`로 반환하되, **`body`에는 `accessToken`을 넣지 않고 `user`만** 포함.
- `AuthController.logout`
  - 삭제용 쿠키(maxAge=0)를 `Set-Cookie`로 반환. 기존 `authService.logout(userId)` no-op 유지.
- `auth/dto/LoginResponse` (계약 변경)
  - `accessToken` 필드 제거 → `{ user: UserResponse }` 형태.
  - 팩토리 시그니처를 `of(User)`로 변경.

### 5.4 `SecurityConfig` (변경 없음 예정)
- CORS는 이미 `allowCredentials(true)` + 명시 Origin(5173/3000)이라 쿠키 인증에 적합.
- CSRF는 계속 disable (same-site + `SameSite=Lax`로 대체).
- ※ 검증: 자격증명 쿠키가 CORS로 정상 저장/전송되는지 실제 확인.

### 5.5 `application.yml` (추가)
```yaml
jwt:
  cookie:
    name: "${JWT_COOKIE_NAME:accessToken}"
    secure: "${JWT_COOKIE_SECURE:false}"
    same-site: "${JWT_COOKIE_SAMESITE:Lax}"
```
- maxAge는 기존 `jwt.expiration`에서 파생.

### 5.6 Swagger
- Swagger UI는 `localhost:8080`과 **동일 출처**라, `/auth/login` 호출로 쿠키가 세팅되면 이후 인증 API 호출에 쿠키가 자동 포함된다 → Authorize 버튼 없이 테스트 가능.

## 6. 프론트 변경

### 6.1 `api/client.ts`
- fetch 옵션에 `credentials: 'include'` 추가.
- `Authorization` 헤더 주입과 `getAccessToken` 사용 제거.
- 401 응답 처리(`clearAuthSession`)는 유지.

### 6.2 `auth/session.ts`
- 토큰 저장/조회(`getAccessToken`, 토큰 setItem) 제거.
- 사용자 프로필 캐시(`farmbroker.user`)만 유지 — 첫 페인트 즉시 표시용.
- `saveAuthSession`은 user만 저장.

### 6.3 세션 복원 (옵션 A)
- `auth/AuthProvider` 마운트 시 `GET /users/me` 호출(쿠키 자동 전송).
  - 200 → user 세팅(캐시 갱신), 로그인 유지.
  - 401 → 로그아웃 상태로 정리(`clearAuthSession`).
- 캐시된 user가 있으면 로딩 중 즉시 표시하되, 부팅 요청 결과로 재검증.

### 6.4 로그아웃
- `POST /auth/logout` 호출(서버가 쿠키 만료) → 성공 시 프론트 캐시 정리.

### 6.5 타입/서비스
- `types/api.ts`의 `LoginResult`에서 `accessToken` 제거(응답이 user만).
- `services/authService.ts` 로그인 응답 처리 수정, `/users/me` 조회 사용.

### 6.6 테스트 갱신
- `auth/__tests__/AuthProvider.test`, `app/__tests__/AuthFlow.test`, `pages/auth/__tests__/LoginPage.test` 등에서 **토큰 저장 검증 → 유저/쿠키 흐름 검증**으로 수정.
- `mocks/handlers.ts`: 로그인 핸들러가 user만 반환, `/users/me` 핸들러 정비(jsdom에선 실제 쿠키 동작이 없으므로 목 기준으로 상태 복원 흐름 검증).

## 7. API 계약 변경 요약

| 엔드포인트 | 변경 |
|---|---|
| `POST /auth/login` | 응답 `Set-Cookie: accessToken=...; HttpOnly; SameSite=Lax` 추가. 본문 `data`에서 `accessToken` 제거, `{ user }`만 |
| `POST /auth/logout` | 응답 `Set-Cookie: accessToken=; Max-Age=0` 추가 |
| 인증 필요 API 전체 | 헤더 대신 쿠키로 인증(헤더도 폴백 허용) |

## 8. 테스트 계획

**백엔드**
- 로그인: 응답에 httpOnly·SameSite=Lax·maxAge 쿠키가 실리고, 본문에 토큰이 없음.
- 쿠키 인증: `Cookie: accessToken=...`만으로 `GET /users/me` 200.
- 헤더 폴백: `Authorization: Bearer` 로도 여전히 200.
- 무효/만료 쿠키: 401 `UNAUTHORIZED`.
- 로그아웃: `AuthControllerLogoutTest`에 만료 쿠키(Set-Cookie maxAge=0) 검증 추가.

**프론트**
- 로그인 후 상태 반영 및 `credentials: 'include'` 전송.
- 부팅 시 `/users/me`로 세션 복원(200/401 분기).
- 로그아웃 시 캐시 정리.

## 9. 롤아웃 / 향후

- 프론트·백엔드가 한 앱이라 **한 번에 함께 배포**(단계적 이행 불필요). 계약 변경(`LoginResponse`) 동시 반영.
- 향후 cross-site 배포로 전환 시: 쿠키를 `SameSite=None; Secure`로 바꾸고 **CSRF 토큰(double-submit)** 도입 필요. 쿠키 속성이 env로 분리돼 있어 전환 용이.
- 향후 로그아웃 강제 무효화가 필요하면 토큰 블랙리스트/Refresh Token 확장(현재 비목표).

## 10. 미해결/리스크

- CORS + 자격증명 쿠키의 실제 브라우저 저장/전송을 반드시 수동 확인(5173→8080).
- `SameSite=Lax`가 same-site 크로스포트 XHR에서 쿠키를 전송하는지 확인(사이트는 포트 무관이므로 전송되어야 함).
- 다른 팀원 프론트/도구가 `Authorization` 헤더에 의존하는 곳이 없는지 확인(중앙 필터라 폴백 유지로 리스크 최소).
