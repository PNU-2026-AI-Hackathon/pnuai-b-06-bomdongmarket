# 봄동마켓 UX 지침

## 내비게이션과 계층

- 전역 header는 브랜드 홈 링크, 주요 desktop navigation, 로그인/공간 등록 action을 제공한다.
- 1024px 미만에서는 하단 5개 탭을 주 이동 수단으로 사용하며 본문은 하단 safe area와 탭 높이만큼 여백을 둔다.
- 현재 위치는 desktop/mobile navigation 모두 색상과 배경을 함께 사용해 표시한다.
- 목록 → 상세 → 신청/등록 흐름의 뒤로 가기는 브라우저 기록을 막지 않는 `Link`를 우선한다.
- 페이지마다 h1을 하나 두고, 하위 업무 구획은 h2, 카드 제목은 문맥에 맞게 h2/h3를 사용한다.
- 핵심 action은 화면당 한 계층의 primary를 유지한다. 같은 구획의 보조 action은 outline/ghost 또는 텍스트 링크를 사용한다.

## 행동과 피드백

- action 동사는 사용자가 얻게 될 결과를 표현한다: `공간 등록`, `AI 추천 실행`, `매칭 신청 보내기`.
- primary는 현재 과업의 다음 단계, secondary/outline은 대안, danger는 되돌리기 어려운 행동에만 사용한다.
- 비동기 action은 시작 즉시 중복 실행을 막고 `등록 중...`, `신청 중...`처럼 진행 상태를 같은 control에 표시한다.
- 성공은 완료 사실과 다음 행동을 함께 안내한다. 예: 공간 등록 완료 후 수익 예측 이동.
- 오류는 원인 또는 실패 과업을 짧게 말하고 가능한 경우 `다시 시도`를 제공한다. 기술 오류 문자열만 노출하지 않는다.
- 빈 상태는 `없음`으로 끝내지 않고 검색어 삭제, 필터 조정, 새 항목 등록 중 적절한 복구 행동을 제안한다.
- loading/empty/error/success는 서로 배타적으로 렌더링한다. 레이아웃 급변을 줄일 수 있는 최소 높이를 유지한다.
- 위험 action을 추가할 때는 영향 대상을 명시하고 확인 또는 복구 경로를 설계한다.

## 폼과 유효성 검사

- 모든 필드는 눈에 보이는 label을 기본으로 한다. 검색/필터처럼 주변 문맥이 충분한 경우만 정확한 `aria-label`로 대체한다.
- 필수/선택 여부, 단위, 입력 예시는 placeholder에만 의존하지 않고 label 또는 helper text에 둔다.
- 제출 전 blur/submit 검증을 일관되게 사용하며, 오류는 필드 가까이에 해결 방법과 함께 표시한다.
- 오류 텍스트 ID를 control의 `aria-describedby`에 연결하고 `aria-invalid`를 설정한다.
- 숫자 입력은 `min`, `max`, 단위를 명시하고 0과 빈 값을 구분한다.
- 제출 중에는 submit control을 disabled로 두되 진행 문구를 유지한다.
- 전체 폼 오류가 있으면 form 상단 summary를 제공하고, 후속 개선 시 첫 오류로 focus 이동을 검토한다.
- 필터 form에서 Enter가 페이지 이동이나 새로고침을 일으키지 않도록 submit 동작을 명시한다.

## 접근성

- 상호작용은 목적에 맞는 `button`, `a`, `input`, `select`를 사용한다. 클릭 가능한 `div`를 만들지 않는다.
- 모든 기능은 키보드로 도달하고 실행할 수 있어야 하며 DOM 순서는 시각적 읽기 순서와 일치해야 한다.
- 전역 `:focus-visible` 또는 컴포넌트 ring을 제거하지 않는다. sticky/fixed 영역에서 focus outline이 잘리지 않는지 확인한다.
- icon-only control에는 동작을 설명하는 `aria-label`을 제공하고 장식 icon은 `aria-hidden`으로 숨긴다.
- 결과 묶음은 `ul/li`, 단계는 `ol`, 영역은 이름 있는 `section`/landmark를 사용한다.
- 오류는 `role="alert"`, 비동기 진행/성공은 필요할 때 `role="status"`로 알린다. 같은 메시지를 중복 live region에 넣지 않는다.
- 색상만으로 상태를 전달하지 않는다. 텍스트, 아이콘, 형태 중 하나 이상을 함께 제공한다.
- 텍스트 대비는 일반 텍스트 4.5:1, 큰 텍스트 3:1을 목표로 한다. disabled와 장식은 별도지만 의미가 소실되지 않아야 한다.
- 최소 pointer target은 주요 control 44px이다. 작은 carousel dot처럼 시각 크기가 작다면 클릭 영역을 별도로 확보한다.
- 자동 재생은 정지 control을 제공하고 hover/focus 및 `prefers-reduced-motion`에서 멈춘다.

## 반응형 동작

- 320px에서 가로 스크롤, 잘림, control 겹침 없이 핵심 과업을 완료할 수 있어야 한다.
- 모바일에서는 콘텐츠 우선순위를 유지한 채 1열로 쌓는다. 숨기는 정보는 업무 완료에 필요하지 않은 보조 정보여야 한다.
- `sm` 640px: 페이지 header action과 목록 2열 전환
- `md` 768px: 서로 연관된 짧은 filter/field를 한 행에 배치
- `lg` 1024px: desktop navigation과 복합 상세 grid 전환, 모바일 하단 탭 해제
- `xl` 1280px: 카드 3열과 넓은 dashboard 분할
- 고정 폭보다 `max-width`, grid minmax, wrapping을 우선한다.
- 긴 한국어/영문, 200% 확대, 브라우저 기본 font 확대에서도 정보와 action이 사라지지 않아야 한다.
- 모바일/desktop 내비게이션은 같은 정보 구조와 용어를 유지한다.

## 콘텐츠

- 제품명은 `봄동마켓`, 주요 역할은 `공간 제공자`, `도심 농부`, `소비자` 문맥으로 일관되게 쓴다.
- 공간, 매칭, 수익 예측, 로컬 마켓이라는 현재 도메인 용어를 새 동의어로 바꾸지 않는다.
- 제목은 사용자가 할 수 있는 일 또는 확인할 정보를 먼저 말한다.
- 안내는 짧고 직접적인 존댓말을 사용하며, 사용자를 탓하지 않는다.
- 오류: `[무엇을] 하지 못했습니다. [다음 행동]` 구조를 우선한다.
- 빈 상태: `[현재 결과]가 없습니다. [검색/필터/등록 제안]` 구조를 우선한다.
- 로딩: 구체적인 대상과 동작을 말한다. 예: `등록된 공간을 불러오는 중입니다`.
- 버튼에는 `확인`, `다음`보다 결과가 분명한 동사를 사용한다.

## 리뷰 체크리스트

- [ ] 기존 브랜드와 정보 구조를 보존했다.
- [ ] `docs/DESIGN_SYSTEM.md`의 semantic token과 공통 컴포넌트 계약을 따랐다.
- [ ] 새로운 raw color, arbitrary spacing/radius/shadow가 없다. 예외가 있으면 근거와 제거 계획을 기록했다.
- [ ] h1과 landmark, 목록/단계 의미 구조가 올바르다.
- [ ] keyboard 순서, focus-visible, accessible name을 확인했다.
- [ ] loading, empty, error, success, disabled 상태와 복구 행동을 확인했다.
- [ ] 320px, `sm/md/lg/xl` 관련 layout, 긴 텍스트를 확인했다.
- [ ] motion과 자동 재생이 reduced-motion 요구를 따른다.
- [ ] 변경 화면의 관련 test와 lint/typecheck/build 결과를 기록했다.
