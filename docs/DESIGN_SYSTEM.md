# FarmBroker 디자인 시스템

## 기반 원칙

FarmBroker는 도심 스마트팜의 순환과 신뢰를 표현하는 농업형 서비스다. 기존 코드의 짙은 `leaf` CTA, 따뜻한 `soil` 강조, 보조 정보의 `skyfarm`, 높은 가독성의 `ink`, 옅은 녹색·베이지 배경 그라데이션을 브랜드 기반으로 유지한다.

## 브랜드 자산

| 자산        | 경로                                                | 용도                              |
| ----------- | --------------------------------------------------- | --------------------------------- |
| 심벌        | `farmbroker-web/public/brand/farmbroker-symbol.png` | 파비콘, 좁은 헤더, 아이콘형 노출  |
| 가로형 로고 | `farmbroker-web/public/brand/farmbroker-lockup.svg` | 문서, 소개 자료, 넓은 브랜드 영역 |

- 제품명 표기는 공백 없는 `FarmBroker`로 통일한다.
- 심벌은 투명 배경 PNG 원본을 사용하고 비율을 바꾸거나 별도의 조명·배경 효과를 다시 적용하지 않는다.
- 가로형 로고는 같은 디렉터리의 심벌 PNG를 참조하므로 배포하거나 복사할 때 두 파일을 함께 유지한다.
- 앱 안에서 제품명을 텍스트로 조합할 때는 `APP_INFO.name`을 사용한다.

이 문서는 새 시각 취향을 추가하는 명세가 아니다. `tailwind.config.ts`, `src/styles/index.css`, 공통 컴포넌트, 12개 현재 화면에서 반복되는 규칙을 이름 붙인 현재 상태의 계약이다. primitive 팔레트는 호환성을 위해 유지하되 신규 공통 UI와 마이그레이션 화면은 semantic token을 우선한다.

## 토큰

### 색상

| 분류   | semantic token                                                  | 기준값/참조                            | 근거                               | 사용                                             |
| ------ | --------------------------------------------------------------- | -------------------------------------- | ---------------------------------- | ------------------------------------------------ |
| 배경   | `canvas`                                                        | `#f6f8f3`                              | 전역 body와 앱 배경에 3회          | 페이지 최하위 배경                               |
| 표면   | `surface`, `surface-subtle`                                     | white, `leaf-50`                       | 카드 17회, 옅은 패널 반복          | 카드/필드, 보조 패널                             |
| 경계   | `line`, `line-strong`                                           | `leaf-100`, `leaf-200`                 | `rounded-app` 컨테이너의 기본 경계 | 기본/hover 경계                                  |
| 본문   | `content`, `content-muted`, `content-subtle`, `content-inverse` | `ink-900`, slate-600, slate-500, white | 제목·본문·메타 정보의 반복 계층    | 텍스트 계층                                      |
| 행동   | `action`, `action-hover`, `action-soft`                         | `leaf-700`, `leaf-800`, `leaf-100`     | 주요 CTA, 링크, 선택 상태          | primary action과 focus                           |
| 강조   | `accent`, `accent-soft`                                         | `soil-700`, `soil-100`                 | eyebrow, 면적/캠페인 강조          | 작은 텍스트에서도 대비를 확보한 브랜드 보조 강조 |
| 피드백 | `feedback-danger`, `feedback-danger-soft`                       | red-700, red-50                        | 폼/API 오류 상태                   | 오류 텍스트·표면                                 |
| 피드백 | `feedback-success`, `feedback-success-soft`                     | `leaf-700`, `leaf-50`                  | 저장/매칭 성공 상태                | 성공 텍스트·표면                                 |

CSS custom property는 공백으로 구분한 RGB 채널이며 Tailwind에서 alpha modifier를 지원한다. 예: `bg-action/90`. 신규 화면에서 raw hex를 직접 추가하지 않는다.

### 타이포그래피

| token                | 값                               | 사용                   |
| -------------------- | -------------------------------- | ---------------------- |
| `font-sans`          | Inter → Pretendard → system sans | 전체 UI                |
| `text-eyebrow`       | 14/20, 600, tracking 0.16em      | 페이지 범주, uppercase |
| `text-page-title`    | 30/36, 900                       | 모바일 h1              |
| `text-page-title-lg` | 36/40, 900                       | `sm` 이상 h1           |
| `text-body-sm`       | 14/24                            | 페이지 설명과 안내     |

- 페이지마다 h1은 하나를 사용한다.
- 본문은 기본 14px라도 긴 설명에는 24px line-height를 유지한다.
- 숫자/핵심 지표의 `font-black`은 기존 대시보드와 가격 표현에서만 유지한다.
- 작은 eyebrow는 canvas 대비 6.13:1인 semantic `accent`를 사용한다. 장식 목적의 `soil-500`을 본문 텍스트로 복제하지 않는다.
- 한국어 홍보 문구는 `break-keep`으로 어절 단위 개행을 유지한다. `<br />`이나 `&nbsp;`로 줄바꿈을 고정하지 않는다.

### 간격과 크기

- 기본 간격은 Tailwind 4px scale을 사용한다.
- 컨트롤 높이는 `control` 44px, 큰 CTA는 `control-lg` 48px이다.
- 자주 쓰는 컴포넌트 내부 간격은 12px(`p-3`), 16px(`p-4`), 20px(`p-5`)이며 카드 용도에 맞는 `padding` prop을 우선한다.
- 페이지 섹션 간격은 24px(`mt-6`)을 기본으로 하고, 큰 업무 구획은 32px(`mt-8`)을 사용한다.
- 모바일 페이지 좌우 여백은 16px, `sm` 이상은 24px이다.
- arbitrary spacing은 safe area, 계산식, 고유 grid처럼 CSS 의미가 필요한 경우만 허용하며 근거를 남긴다.

### Radius, elevation, motion

| token          | 값                    | 사용                                |
| -------------- | --------------------- | ----------------------------------- |
| `rounded-app`  | 8px                   | 카드, 필드, 버튼, nav item          |
| `rounded-full` | full                  | badge, avatar, carousel dot         |
| `shadow-card`  | 낮은 녹색 계열 shadow | 정적 surface                        |
| `shadow-lift`  | 한 단계 높은 shadow   | 주요 CTA, hover card, sticky action |
| `duration-ui`  | 150ms                 | hover/focus 색상과 작은 lift        |

- 큰 캠페인 카드의 24px radius는 현재 홈 고유 예외다. 다른 화면으로 복제하지 않는다.
- 레이아웃을 크게 이동시키는 motion을 신규 도입하지 않는다.
- `prefers-reduced-motion: reduce`에서는 transition과 animation을 사실상 제거한다.

### Breakpoint

`BREAKPOINTS`와 Tailwind 기본값을 함께 사용한다.

| 이름 |     폭 | 역할                                    |
| ---- | -----: | --------------------------------------- |
| `sm` |  640px | 헤더 action 정렬, 카드 2열              |
| `md` |  768px | 다중 필드/필터 grid                     |
| `lg` | 1024px | desktop navigation, 모바일 하단 탭 해제 |
| `xl` | 1280px | 목록 카드 3열, 넓은 dashboard grid      |

320px를 최소 지원 폭으로 검증하며, breakpoint를 페이지 로컬 숫자로 다시 정의하지 않는다.

## 컴포넌트 계약

### Button과 buttonStyles

- 목적: `Button`은 현재 화면에서 동작하는 action, `buttonStyles`는 라우트 이동 `Link`에 같은 시각 계층을 제공한다.
- variant: `primary`, `secondary`, `outline`, `ghost`, `danger`
- size: `sm` 36px, `md` 44px, `lg` 48px
- 상태: hover, focus-visible, disabled를 모든 variant에 제공한다. 비동기 중에는 `disabled`와 진행형 문구를 함께 쓴다.
- 접근성: 기본 `type="button"`이다. 폼 제출에서만 `type="submit"`을 명시한다. 아이콘만 있으면 `aria-label`이 필수다.
- 금지: 내비게이션에 `button` + `navigate`를 쓰거나, 동작에 `Link`를 쓰지 않는다.

```tsx
<Button disabled={isSaving} type="submit">
  {isSaving ? '등록 중...' : '공간 등록'}
</Button>

<Link className={buttonStyles({ variant: 'outline' })} to={ROUTES.spaces}>
  공간 보기
</Link>
```

### Card

- 목적: 관련 정보의 얕은 surface. 카드 전체가 action인 것처럼 보이게 만들지 않는다.
- variant: `default`, `interactive`, `subtle`
- padding: `none`, `sm`, `md`, `lg`; 복합 카드가 자체 영역 padding을 가질 때 `none`
- 상태: `interactive`는 hover에서 작은 lift와 경계 강조만 제공한다.
- 접근성: `Card` 자체는 `div`이며 의미 구조는 호출부의 `section`, `article`, `li`로 제공한다. 클릭 이벤트를 `Card`에 직접 달지 않는다.

### Input, Select, Textarea

- 목적: text/number 입력, 단일 선택, 여러 줄 입력의 공통 field shell
- 상태: default, hover, focus, disabled, invalid
- slot: 공통 `label`, `helperText`, `errorMessage`; Input/Select는 선택 `icon`
- 접근성:
  - 명시적 `id`, `name`, 또는 생성 ID로 label을 연결한다.
  - helper/error는 `aria-describedby`로 연결한다.
  - 오류는 `aria-invalid`와 `role="alert"`을 함께 쓴다.
  - 시각 label을 생략하면 정확한 `aria-label`을 제공한다.
- 크기: Input/Select는 기본 44px이다. Textarea는 용도에 맞춰 표준 spacing scale의 `min-height`만 조정하고 field shell은 재작성하지 않는다.

### Badge

- 목적: 상태·신선도·권한 같은 짧은 비대화형 의미 표시
- tone: `green`, `yellow`, `blue`, `slate`, `red`
- 상태: interactive state 없음
- 접근성: 색만으로 의미를 전달하지 않고 텍스트를 포함한다. 클릭 필터에는 Badge 대신 Button을 사용한다.

### PageHeader

- 목적: 목록·폼 화면의 eyebrow, h1, 설명, 보조/주요 action 계층
- slot: `eyebrow`, `title`, 선택 `description`, 선택 `action`
- 정렬: 기본 `left`; 인증처럼 중앙 정렬이 정보 구조에 맞을 때 `center`
- 반응형: 모바일 세로 배치, 기본 `sm` 이상에서 제목과 action을 양끝 정렬한다. 긴 목록 제목은 `actionBreakpoint="lg"`로 충돌을 피한다.
- 접근성: 내부 title은 h1이다. 한 페이지에서 한 번만 사용한다.

### ConfirmDialog

- 목적: 되돌리기 어려운 action 직전에 한 번 더 의사를 확인한다. 알림·폼·상세 표시용 modal이 아니다.
- slot: `title`(질문 문장), 선택 `description`(결과와 복구 경로), `confirmLabel`, 선택 `cancelLabel`(기본 `닫기`)
- tone: 기본 `default`. 신청 취소처럼 되돌릴 수 없는 결과에는 `danger`를 써서 확인 버튼을 `Button variant="danger"`로 바꾼다.
- 상태: `isPending` 동안 확인·닫기 버튼과 Escape를 모두 막아 요청이 뜬 채로 닫히지 않게 한다.
- 열림 상태는 컴포넌트가 갖지 않는다. 호출부가 `useDisclosure`로 들고 `isOpen`/`onCancel`을 내려준다.
- 접근성: `role="dialog"` + `aria-modal`, `title`/`description`을 `aria-labelledby`/`aria-describedby`로 연결한다. 열릴 때 확인 버튼으로 포커스를 옮기고, Escape와 backdrop 클릭은 취소로 처리한다. 열려 있는 동안 body 스크롤을 잠근다.
- 확인 팝업이 필요한지 먼저 판단한다. 되돌리기 쉬운 action에 습관적으로 붙이면 사용자가 팝업을 읽지 않고 넘기게 된다.

### ApplicationNotificationsDialog

- 목적: 로그인 후 어느 화면에서나 헤더 알림 버튼으로 받은 신청과 보낸 신청을 한 번에 확인하는 관리 모달이다.
- 범위: 헤더에서 열리지만 신청 카드와 함께 대시보드 기능 폴더에 유지한다. 다른 종류의 알림까지 확장될 때 공통 Dialog primitive로 승격한다.
- ConfirmDialog와의 구분: 단일 결정을 확인하는 팝업이 아니라 여러 신청의 상태와 action을 제공하므로 ConfirmDialog를 재사용하지 않는다.
- 상태: 받은 신청과 보낸 신청은 각각 빈 상태를 제공하고, 로딩·조회 실패·처리 오류는 모달 안에서 공통 상태 컴포넌트와 role=alert로 알린다. 모든 신청 카드의 삭제 버튼은 신청 상태를 바꾸지 않고 알림 목록에서만 숨기며, 실행 전 `ConfirmDialog`로 한 번 확인한다.
- 접근성: role=dialog와 aria-modal, 제목 연결, 명시적인 닫기 버튼을 제공한다. 열릴 때 모달 내부로 focus를 옮기고 Tab을 모달 안에 가두며, Escape·backdrop·닫기 버튼으로 닫은 뒤 알림 버튼으로 focus를 복귀시킨다.
- 스크롤: 열린 동안 body 스크롤을 잠그고, 작은 화면에서는 모달 내부 목록만 스크롤한다.

### Footer

- 목적: 서비스 주체(팀명), 저작권, 문의 창구, 주요 화면 바로가기를 담아 화면 하단을 마감한다.
- 범위: 현재 홈 전용이다. 다른 화면에도 필요해지면 `AppLayout`으로 올리고 `PageContainer`의 하단 여백과 함께 조정한다.
- 구조: `<footer>` 하나로 `contentinfo` landmark를 제공하고, 폭은 헤더와 같은 `max-w-7xl px-4 sm:px-6`을 맞춘다. `PageContainer`는 `<main>`을 렌더하므로 footer 안에 쓰지 않는다.
- 바로가기: `PRIMARY_NAVIGATION`을 재사용하고 `<nav aria-label="서비스 바로가기">`로 헤더 내비게이션과 landmark를 구분한다.
- 외부 링크: `<a target="_blank" rel="noreferrer">`에 lucide 아이콘(`ExternalLink`, `Github`)을 함께 둔다. `index.css`가 링크 색과 밑줄을 제거하므로 `text-content-muted hover:text-action hover:underline`처럼 색·밑줄을 명시한다.
- 없는 화면으로 연결하지 않는다. 이용약관·개인정보처리방침 페이지가 없는 동안은 항목을 넣지 않는다. catch-all 라우트가 홈으로 되돌려 보내 사용자가 이유를 알 수 없다.
- 여백: 모바일 고정 하단 탭에 가려지지 않도록 `pb-24 lg:pb-10`을 footer가 직접 갖는다.

### LoadingState, EmptyState, ErrorState

- `LoadingState`: `role="status"`와 현재 작업을 설명하는 문구를 제공한다. spinner는 장식으로 숨긴다.
- `EmptyState`: 무엇이 비어 있는지와 필터 조정 등 다음 행동을 함께 쓴다.
- `ErrorState`: `role="alert"` 성격의 오류 문구와 가능한 경우 다시 시도 action을 제공한다.
- 상태 컴포넌트를 동시에 둘 이상 렌더링하지 않는다.

### 외부 검색으로 채우는 필드 (AddressField, SpaceLocationMap)

- 목적: 외부 데이터로만 값이 확정되는 입력. 첫 사례는 공간 등록의 주소(카카오 우편번호 API)다.
- 구성: 검색으로만 채우는 `readOnly` Input + 검색 Button + 검색 결과에 없는 나머지를 받는 보조 Input + 결과 미리보기.
- 정렬: 검색 Button은 Input의 label 높이(`mt-7`)만큼 내려 입력칸과 윗변을 맞춘다. `items-end`는 helper/error 높이에 따라 흔들려 쓰지 않는다.
- 검증: `readOnly` 필드는 브라우저 `required`가 걸리지 않으므로 제출 시점에 상위 폼이 직접 막고 `errorMessage`로 이유를 밝힌다.
- 미리보기: 결과 확인용 지도·이미지는 필드 바로 아래에 두고, 값이 없으면 렌더하지 않는다. 외부 SDK 키가 없거나 로드에 실패해도 안내 문구로 대체하고 폼 자체는 끝까지 동작해야 한다.
- 접근성: 지도 캔버스는 `aria-hidden`으로 숨기고 같은 정보를 텍스트로 함께 제공한다. 로딩은 `LoadingState`(`role="status"`), 실패는 `role="alert"` 문구와 다시 시도 Button으로 알린다.

## 사용 규칙

### 권장

- primitive 색보다 `bg-surface`, `text-content-muted`, `text-action` 같은 역할 token을 사용한다.
- 기존 공통 컴포넌트의 variant/size가 목적을 표현하면 그대로 사용한다.
- 화면 고유 grid와 업무 컴포넌트는 페이지 폴더에 유지한다.
- 새로운 공통 pattern은 3회 이상 반복되거나 핵심 화면에서 같은 역할을 할 때만 추가한다.
- 시각 변경 없이 token으로 치환하더라도 320px, keyboard, test를 확인한다.

### 금지

- 근거 없는 raw hex, arbitrary spacing/radius/shadow 추가
- `Button`, `Input`, `Card`와 동일한 class 묶음을 페이지에서 재작성
- disabled를 단순히 색상만 흐리게 표현
- click handler를 `div`/`Card`에 붙여 semantic control을 우회
- 한 번에 모든 페이지를 migration

## 도입 상태

| 화면/컴포넌트                                  | 상태           | 메모                                    |
| ---------------------------------------------- | -------------- | --------------------------------------- |
| semantic color/typography/control/motion token | 적용           | legacy palette는 호환성 유지            |
| Button/buttonStyles                            | 규격화         | 기존 API 유지, semantic token 연결      |
| Card                                           | 규격화         | variant/padding 추가, 기존 default 호환 |
| Input                                          | 규격화         | 생성 ID와 공통 field style 적용         |
| Select                                         | 신규 규격      | `/spaces`에서 시험                      |
| Textarea                                       | 신규 규격      | 등록 메모·URL·매칭 메시지에 적용        |
| ConfirmDialog                                  | 신규 규격      | 매칭 신청·신청 취소 확인에 적용         |
| PageHeader                                     | 확장 적용      | 목록·폼·인증 정렬과 action breakpoint   |
| Footer                                         | 신규 규격      | 홈 전용, 필요 시 AppLayout으로 승격     |
| LoadingState                                   | 규격화         | spinner를 보조기술에서 숨김             |
| 공간 목록 `/spaces`                            | 시험 적용 완료 | 대표 화면                               |
| 목록·등록·인증·상세 보조 화면                  | 선택 적용 완료 | 반복 헤더·필드·카드·링크만 교체         |
| 홈 캠페인·대시보드 고유 영역                   | 유지           | 고유 정보 구조와 시각 예외 보존         |
