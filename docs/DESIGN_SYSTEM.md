# 봄동마켓 디자인 시스템

## 기반 원칙

봄동마켓은 도심 스마트팜의 순환과 신뢰를 표현하는 농업형 서비스다. 기존 코드의 짙은 `leaf` CTA, 따뜻한 `soil` 강조, 보조 정보의 `skyfarm`, 높은 가독성의 `ink`, 옅은 녹색·베이지 배경 그라데이션을 브랜드 기반으로 유지한다.

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

### Input과 Select

- 목적: text/number 입력과 단일 선택의 공통 field shell
- 상태: default, hover, focus, disabled, invalid
- slot: `label`, `icon`, `helperText`, `errorMessage`
- 접근성:
  - 명시적 `id`, `name`, 또는 생성 ID로 label을 연결한다.
  - helper/error는 `aria-describedby`로 연결한다.
  - 오류는 `aria-invalid`와 `role="alert"`을 함께 쓴다.
  - 시각 label을 생략하면 정확한 `aria-label`을 제공한다.
- 크기: 기본 44px. 한 화면에서 임의로 높이를 바꾸지 않는다.

### Badge

- 목적: 상태·신선도·권한 같은 짧은 비대화형 의미 표시
- tone: `green`, `yellow`, `blue`, `slate`, `red`
- 상태: interactive state 없음
- 접근성: 색만으로 의미를 전달하지 않고 텍스트를 포함한다. 클릭 필터에는 Badge 대신 Button을 사용한다.

### PageHeader

- 목적: 목록·폼 화면의 eyebrow, h1, 설명, 보조/주요 action 계층
- slot: `eyebrow`, `title`, 선택 `description`, 선택 `action`
- 반응형: 모바일 세로 배치, `sm` 이상에서 제목과 action을 양끝 정렬한다.
- 접근성: 내부 title은 h1이다. 한 페이지에서 한 번만 사용한다.

### LoadingState, EmptyState, ErrorState

- `LoadingState`: `role="status"`와 현재 작업을 설명하는 문구를 제공한다. spinner는 장식으로 숨긴다.
- `EmptyState`: 무엇이 비어 있는지와 필터 조정 등 다음 행동을 함께 쓴다.
- `ErrorState`: `role="alert"` 성격의 오류 문구와 가능한 경우 다시 시도 action을 제공한다.
- 상태 컴포넌트를 동시에 둘 이상 렌더링하지 않는다.

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
| PageHeader                                     | 신규 규격      | `/spaces`에서 시험                      |
| LoadingState                                   | 규격화         | spinner를 보조기술에서 숨김             |
| 공간 목록 `/spaces`                            | 시험 적용 완료 | 대표 화면                               |
| 나머지 화면                                    | 미적용         | `UI_AUDIT.md`의 화면별 backlog로 이동   |
