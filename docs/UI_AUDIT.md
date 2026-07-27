# UI 감사

## 범위와 기준선

- 프론트엔드 루트: `farmbroker-web`
- 스택과 스타일: React 19, React Router 7, TypeScript 5.7, Vite 8, Tailwind CSS 3.4, 전역 CSS
- 조사 화면: 홈, 로그인/회원가입, 공간 목록/등록/상세, 농부 매칭/수익 예측, 마켓 목록/상세, 대시보드/계약/마이페이지의 13개 페이지
- 조사 기반: 라우터, 공통 레이아웃 5개, 공통 UI, 페이지 로컬 컴포넌트, 전역 CSS, Tailwind 설정, 테스트
- 기존 사용자 변경: 시작 시 `git status --short`, staged diff, unstaged diff 모두 없음
- 구현 전 검증:
  - `lint`: 통과
  - `typecheck`: 기존 실패. `farmerContent` 모듈 누락에서 파생된 6개 오류와 `vite.config.ts`의 Vitest `test` 타입 오류 1개
  - `test`: 11 suite 중 8개 통과, `farmerContent` 누락 import를 타는 3개 suite 실패
  - `build`: `farmerContent` 모듈 누락으로 실패
- 기준선 변경: 사용자 승인에 따라 현재 브랜치를 `main` 위로 rebase했다. `main`의 `27dc3da`가 `farmerContent.ts`를 복원했고, 작업 중 변경은 stash/pop으로 모두 보존했다.
- 최종 검증:
  - `lint`: 통과
  - `typecheck`: 통과. Vite와 Vitest 설정을 `vite.config.ts`/`vitest.config.ts`로 분리해 기존 타입 충돌 해결
  - `test`: 13 suite, 33 tests 모두 통과
  - `build`: 통과

## 패턴 목록

| 패턴            | 증거와 빈도                                                              | 기존 변형                                           | 결정                                                                       |
| --------------- | ------------------------------------------------------------------------ | --------------------------------------------------- | -------------------------------------------------------------------------- |
| 농업 브랜드 색  | `leaf`, `soil`, `skyfarm`, `ink`가 `tailwind.config.ts`와 전 화면에 반복 | 일부 상태는 Tailwind 기본 red/slate 사용            | 기존 팔레트를 보존하고 역할 기반 semantic token을 위에 매핑                |
| 앱 radius       | `rounded-app` 56회                                                       | `rounded-full` 15회, `rounded-[1.5rem]` 1회         | 기본 컨테이너/컨트롤은 8px, pill은 `full`; 24px 예외는 홈 후속 정리        |
| 카드 surface    | `Card` 18회, `shadow-card` 13회, `shadow-lift` 5회                       | 페이지에서 border/background/shadow 직접 조합       | `Card`의 `variant`와 `padding` 계약으로 규격화                             |
| 버튼/링크 CTA   | `Button` 17회, `buttonStyles`를 이용한 `Link`, 로컬 CTA 2회              | 버튼과 링크가 같은 시각 역할을 별도 class로 구현    | 버튼은 `Button`, 내비게이션은 `buttonStyles`를 사용                        |
| 폼 필드         | `Input` 16회, 로컬 `select` 1회, 로컬 `textarea` 3회                     | label, focus, error 연결이 각 화면에 분산           | `Input`/`Select`의 label·helper·error 계약 통일; textarea는 화면 단위 후속 |
| 페이지 제목     | `tracking-[0.16em]` 12회, 그중 페이지/섹션 eyebrow가 10개 파일에 반복    | 제목 정렬과 보조 액션 breakpoint가 `sm`/`lg`로 갈림 | 공통 `PageHeader`로 계층을 고정하고 `/spaces`에서 시험                     |
| 비동기 상태     | `LoadingState` 8회, `ErrorState` 6회, `EmptyState` 3회                   | 성공 메시지는 페이지 로컬                           | 공통 상태 컴포넌트를 유지하고 상태별 ARIA 계약을 문서화                    |
| 반응형 레이아웃 | `PageContainer` 14회, Tailwind 기본 `sm/md/lg/xl`과 `BREAKPOINTS` 일치   | 일부 임의 grid template은 업무 구조상 고유          | 기본 breakpoint를 표준으로 유지하고 고유 grid는 로컬 유지                  |

## 발견 사항

| 우선순위 | 영역                  | 증거                                                                                                         | 사용자 영향                                             | 권장 범위                                                            |
| -------- | --------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------- | -------------------------------------------------------------------- |
| P1       | 의미 토큰 부재        | 브랜드 primitive는 있으나 surface/text/action 역할이 class 조합에 반복되고 `AppLayout`에 `bg-[#f6f8f3]` 존재 | 같은 의미가 다른 raw/primitive 값으로 확산될 수 있음    | semantic color, control height, typography, motion token 추가        |
| P1       | 공통 헤더 반복        | eyebrow + h1 + 설명 조합이 10개 파일, 12회                                                                   | 화면마다 제목 간격·breakpoint·액션 정렬이 달라질 위험   | `PageHeader`를 만들고 `/spaces`에만 적용                             |
| P1       | 폼 필드 계약 분산     | 공통 `Input` 외 `select` 1회와 `textarea` 3회가 로컬 class 사용                                              | focus/error/disabled 표시와 label 연결이 달라질 수 있음 | `Select`를 추가해 `/spaces` 필터에 적용; textarea는 후속 화면별 적용 |
| P1       | 기존 빌드 기준선 실패 | 누락된 `farmerContent` import와 Vite/Vitest config 타입 충돌이 검증 차단                                     | 전체 회귀 신뢰도가 낮고 배포 빌드가 막힘                | 해결: 승인된 `main` rebase로 상수 복원, Vite/Vitest config 분리      |
| P1       | 작은 강조 텍스트 대비 | `soil-500` eyebrow가 12회 반복되며 canvas 대비 2.91:1                                                        | 14px 범주 텍스트를 저시력 사용자가 읽기 어려움          | semantic `accent`를 `soil-700` 6.13:1로 정의, 화면별 마이그레이션    |
| P2       | CTA 구현 우회         | `SpaceCard`, `RecommendationCard`에 primary CTA class 중복                                                   | hover/focus/disabled 변경이 누락될 수 있음              | 대표 화면의 `SpaceCard`만 `buttonStyles`로 교체                      |
| P2       | 목록 의미 구조        | `SpaceList`가 카드 grid를 일반 `div`로 렌더링                                                                | 보조기술에서 결과 묶음과 항목 수를 파악하기 어려움      | `/spaces`에서 `ul/li`로 보강                                         |
| P2       | 임의 시각값           | 앱 배경 raw color 1회, 임의 그림자 2회, 임의 24px radius 1회                                                 | 토큰을 우회한 값이 늘어날 가능성                        | 배경만 기반 토큰으로 전환; 헤더/하단 탭/홈 카드는 화면별 후속        |
| P2       | 상태 색상 계약        | 성공은 leaf, 오류는 red, 정보는 skyfarm으로 관례만 존재                                                      | 색상만 복사하면 상태 의미와 live region이 빠질 수 있음  | `feedback` token과 상태별 텍스트/ARIA 지침을 함께 적용               |
| P3       | 로컬 icon button      | 대시보드와 캐러셀에 각기 다른 icon-only button                                                               | 크기와 focus 스타일 유지보수가 분산                     | 해당 화면을 마이그레이션할 때 `IconButton` 필요성 재평가             |

## 접근성 및 반응형 검토

- 키보드/focus: 전역 `:focus-visible`과 공통 버튼·필드 ring이 존재한다. 실제 브라우저에서 CTA의 focus ring과 44px control을 확인했다. accessible tree와 DOM은 공간 등록 → 검색 → 최소 면적 → 최대 월세 → 정렬 → 카드 상세 링크 순서를 유지한다. 캐러셀은 focus/hover 중 자동 재생을 멈추고 정지 버튼을 제공한다.
- 의미/이름: 기존 입력은 `aria-label` 또는 label을 제공한다. 시험 적용에서 필터를 이름 있는 `search` landmark로, 결과를 `ul/li`로 바꿨다. icon-only 컨트롤은 현재 조사 범위에서 accessible name을 제공한다.
- 대비/상태 전달: leaf/soil/ink의 기존 브랜드 대비를 유지한다. 오류와 성공은 색상 외 텍스트를 함께 사용하고, 오류는 `role="alert"`, 비동기 상태는 `role="status"`를 사용한다.
- 320px/breakpoint: 실제 브라우저 320×800에서 `scrollWidth === clientWidth === 320`, CTA/필드 44px, 카드 1열 288px을 확인했다. 하단 nav는 73px이고 main bottom padding은 96px이다. 1280px에서는 필터 4열과 400px 카드 3열을 확인했다.
- motion: 기존 캐러셀의 `prefers-reduced-motion` 대응에 더해 전역 reduce-motion 안전망을 토큰 기반으로 추가했다.
- 상호작용: 실제 브라우저에서 `서면` 검색 시 결과가 1개로 갱신되고, 정렬 select가 `낮은 월세순` 값으로 변경되는 것을 확인했다.

## 대표 화면

- 선정 화면: 공간 목록 `/spaces`
- 선정 근거:
  - 비로그인 핵심 탐색 흐름이라 변경 위험이 낮다.
  - 페이지 헤더, CTA, 3종 입력, 선택, 카드, 배지, 이미지, loading/empty/error 상태를 한 화면에서 검증한다.
  - 320px 1열부터 `xl` 3열까지 반응형 패턴을 대표한다.
  - `SpacesPage`와 `SpaceCard` 테스트가 이미 존재한다.
- 포함 변경:
  - semantic token 적용
  - `PageHeader`, `Select`, `Card interactive` 계약 시험
  - `SpaceCard` 링크형 CTA의 `buttonStyles` 재사용
  - search landmark, 결과 목록 의미 구조, 필드 ID/설명 연결 보강
- 명시적 제외:
  - 다른 페이지 헤더·카드·폼의 일괄 교체
  - 홈 캠페인, 헤더, 하단 내비게이션의 독자적인 그림자/radius 재설계
  - 정보 구조, 문구, 이미지, 라우트, 데이터 흐름 변경
  - `main` rebase로 들어온 인증/회원가입 화면의 UI 마이그레이션

## 마이그레이션 백로그

| 순서 | 화면/컴포넌트   | 이유                                               | 선행 조건                      | 검증                                           |
| ---- | --------------- | -------------------------------------------------- | ------------------------------ | ---------------------------------------------- |
| 1    | 마켓 목록       | `/spaces`와 같은 검색·카드·페이지 헤더 패턴        | `PageHeader`, 필드 계약 안정화 | `MarketPage.test.tsx`, 320px/desktop           |
| 2    | 농부 매칭 목록  | 검색, 카드, 빈/오류 상태가 동일                    | 마켓 적용 결과 확인            | `FarmerPage.test.tsx`, keyboard                |
| 3    | 공간 등록       | textarea, checkbox, sticky action 규격 필요        | textarea/checkbox 계약 설계    | `SpaceCreatePage.test.tsx`, validation states  |
| 4    | 로그인/회원가입 | error summary, role radio, loading 버튼 계약 검증  | Button loading API 필요성 판단 | auth tests, focus/error                        |
| 5    | 공간 상세       | back link, 복합 카드, textarea 포함                | 상세 전용 패턴 유지 기준 합의  | `SpaceDetailPage.test.tsx`, authenticated flow |
| 6    | 대시보드        | icon button, quick action, 상태 카드 포함          | 공통 IconButton 계약 검토      | dashboard tests, mobile/desktop                |
| 7    | 홈 캠페인       | 의도적인 대형 radius/그림자와 motion을 보존해야 함 | 캠페인 예외 토큰 근거 수집     | carousel keyboard/reduced-motion               |

## 대표 화면 이후 선택 적용

`/spaces` 시험 적용에서 확인한 계약을 반복 패턴에만 확장했다. 화면의 정보 구조, 데이터 흐름, 문구, 이미지와 업무 고유 UI는 변경하지 않았다.

- 마켓·농부 매칭 목록: `PageHeader`, `Card`, 링크형 CTA를 재사용하고 기존 검색·카테고리 동작은 유지
- 공간 등록: `PageHeader`, 카드 padding, 공통 `Textarea`를 적용하고 checkbox·sticky action은 화면 고유 패턴으로 유지
- 로그인·회원가입: 중앙 정렬 `PageHeader`만 적용하고 인증 폼 구조와 role 선택 UI는 유지
- 상품·공간 상세와 수익 예측: 뒤로가기 `Link`에 `buttonStyles`, 반복 카드에 padding 계약, 매칭 메시지에 `Textarea` 적용
- 계약·마이페이지: 반복 헤더 또는 카드 padding만 선택 적용
- 홈 캠페인과 대시보드 고유 greeting/quick action/icon button은 이번 범위에서 제외

이에 따라 기존 백로그 1~5의 공통 primitive 적용은 완료했다. 대시보드와 홈은 고유 패턴을 별도 검토할 때까지 유지한다.
