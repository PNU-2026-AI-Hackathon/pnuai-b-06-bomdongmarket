# 디자인 시스템 규칙 추출 지침

## 근거

- 토큰 후보마다 사용 위치와 빈도를 제시한다. 빈도만 높고 의미가 불명확하면 즉시 토큰화하지 않는다.
- 브랜드 색, 로고, 핵심 CTA, 주요 surface를 우선적인 의미 기준으로 삼는다.
- 현재 공통 컴포넌트와 핵심 화면에서 의도적으로 반복되는 값을 canonical 값으로 우선한다.
- 충돌하는 값은 사용자 영향과 사용 맥락을 비교하고, 대표 화면 시험 적용 범위에서만 정규화한다.

## 토큰

- 현재 프로젝트 방식에 맞춰 CSS custom properties, Tailwind theme, theme object 또는 동등한 기존 수단을 사용한다.
- 이름은 원시 색상보다 역할을 나타내는 semantic token을 우선한다. 기존 이름이 널리 쓰이면 호환성을 유지한다.
- color, typography, spacing, radius, shadow, motion, breakpoint를 모두 조사하되 근거 없는 category를 억지로 만들지 않는다.
- 신규 코드에는 raw hex와 arbitrary spacing/radius를 추가하지 않는다. 불가피한 예외는 문서에 이유와 제거 계획을 남긴다.

## 컴포넌트

- 3회 이상 반복되거나 여러 핵심 화면에서 같은 역할을 맡는 패턴을 우선 검토한다. 횟수는 판단 기준이지 기계적 조건이 아니다.
- API는 `variant`, `size`, `state`, content slot, accessible name, keyboard behavior를 명시한다.
- 지나친 추상화를 피하고 한 페이지에만 존재하는 복합 업무 UI는 페이지 로컬로 유지한다.
- 기존 import와 props를 가능한 한 호환하고, 불가피한 변경은 작고 검색 가능한 단위로 만든다.

## 저장소 지침 연결

- `AGENTS.md`에는 상세 규칙을 복제하지 말고 `docs/DESIGN_SYSTEM.md`와 `docs/UX_GUIDELINES.md` 링크, 적용 범위, raw 값 금지, 검증 명령만 간결히 연결한다.
- PR 템플릿에는 기존 항목을 유지하고 토큰 사용, 공통 컴포넌트 재사용, keyboard/focus, responsive, loading/error/empty state, 검증 결과 체크만 추가한다.

## 대표 화면

- 빈도 높은 토큰과 공통 컴포넌트를 함께 보여 주며 테스트가 있는 화면을 우선한다.
- 인증·결제·삭제처럼 실패 위험이 큰 흐름은 동일한 대표성이 있는 저위험 화면이 있으면 피한다.
- 적용 전후의 DOM 의미, 상호작용, 반응형 동작을 유지한다. 시각적 변화는 추출된 규칙을 일관되게 적용하는 수준으로 제한한다.
