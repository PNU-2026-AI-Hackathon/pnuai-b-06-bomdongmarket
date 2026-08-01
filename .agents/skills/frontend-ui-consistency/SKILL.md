---
name: frontend-ui-consistency
description: Implement, modify, or review frontend pages and components against an existing repository design system and UX guidance while preserving scope and established patterns. Use for new frontend pages; UI changes to existing pages; forms, lists, or detail views; additions or changes to shared UI components; responsive layout changes; loading, empty, error, or success states; accessibility and keyboard improvements; and reviews of UI-related pull requests. Do not use for first-time repository-wide design-system creation, whole-project UI audits, backend-only work, or unsolicited comprehensive visual redesigns.
---

# Frontend UI Consistency

기존 디자인 시스템을 구현 기준으로 삼아 요청된 화면만 일관되게 구현·수정·리뷰하라. 구현 작업에는 `references/implementation-checklist.md`를, 리뷰 작업에는 `references/review-checklist.md`를 읽고 적용하라.

## 작업 규칙

- 리뷰 요청이면 읽기 전용으로 조사하고 근거 있는 finding만 보고하라. 명시적인 수정 요청이 없으면 코드를 변경하지 마라.
- 기존 사용자 변경을 삭제하거나 덮어쓰지 마라. `git reset`, `git clean`, 강제 checkout을 사용하지 마라.
- 요청하지 않은 화면, 관련 없는 포맷팅·리팩터링, 전면적인 시각 개편을 금지하라.
- 기존 공통 UI와 variant를 먼저 재사용하라. 페이지 안에서 Button, Input, Modal 등 범용 UI를 다시 구현하지 마라.
- 신규 raw hex, 임의 Tailwind 값, 임의 spacing/radius를 추가하지 마라.
- 새 패턴이 불가피하면 근거와 재사용 범위를 설명하고 `docs/DESIGN_SYSTEM.md`를 함께 갱신하라.

## 실행 절차

다음 순서를 지키고, 리뷰에서는 구현 단계도 변경 없이 적합성을 평가하라.

1. **상태 확인** — 저장소 루트, 브랜치, `git status --short`, staged/unstaged diff를 확인하고 기존 사용자 변경을 기준선으로 기록하라.
2. **지침 확인** — 저장소 루트 `AGENTS.md`와 현재 디렉터리에서 대상 파일까지 적용되는 모든 `AGENTS.md`를 읽어 가장 구체적인 규칙을 적용하라.
3. **디자인 시스템 확인** — `docs/DESIGN_SYSTEM.md`를 읽고 토큰, component contract, variant, 금지 패턴을 추출하라.
4. **UX 지침 확인** — `docs/UX_GUIDELINES.md`를 읽고 사용자 흐름, 상태, 접근성, 반응형, 콘텐츠 규칙을 추출하라.
5. **관련 구현 조사** — 요청 화면의 route, page, feature component, hooks, tests, 스타일과 유사 화면을 조사하라.
6. **공통 UI 검색** — `src/components`와 저장소가 사용하는 다른 공통 UI 위치에서 역할이 같은 컴포넌트와 스타일 helper를 검색하라.
7. **재사용 판단** — 새 컴포넌트를 만들기 전에 기존 API, composition, 기존 variant로 해결 가능한지 확인하고 근거를 남겨라.
8. **범위와 흐름 파악** — 시작점, 주요 과업, Primary Action, 성공·실패 후 이동, 변경 대상과 명시적 제외 대상을 정하라.
9. **일관된 구현** — 현재 토큰과 component variant를 사용해 최소 범위로 구현하라. 기존 variant로 해결되면 새 variant를 만들지 마라.
10. **비동기 상태 점검** — loading, empty, error, success 상태가 필요한지 확인하고 원인, 진행 상황, 다음 행동을 텍스트와 의미 구조로 전달하라.
11. **상호작용 상태 점검** — hover, focus-visible, active, disabled, loading 상태의 시각·동작·pointer/keyboard 계약을 확인하라.
12. **반응형 점검** — 모바일과 데스크톱에서 정보 우선순위, overflow, 긴 텍스트, 터치 영역, 프로젝트 breakpoint 동작을 확인하라.
13. **접근성 점검** — semantic element, heading, label, accessible name, keyboard 순서·조작, focus 이동, 오류 연결을 확인하라. 색상만으로 상태를 전달하지 마라.
14. **검증** — `scripts/validate-frontend.sh`로 lint, typecheck, 관련 test, build를 실행하라. 실제 script나 설치된 로컬 도구만 사용하고 구현 전부터 있던 실패와 신규 실패를 구분하라.
15. **보고** — 변경 또는 review finding, 재사용한 토큰·컴포넌트, 상태·반응형·접근성 확인 결과, 실행한 명령, 기존 오류와 신규 오류를 보고하라.

## 디자인 문서가 없을 때

`docs/DESIGN_SYSTEM.md` 또는 `docs/UX_GUIDELINES.md`가 없으면 프로젝트 디자인을 임의로 만들지 마라.

- 저장소 전체 기준 정립이 필요한 요청이면 `$frontend-design-system-bootstrap` 사용을 권고하고 현재 작업에서 디자인 확장을 중단하라.
- 명백히 작은 수정이면 기존 공통 컴포넌트, 인접 화면, 현재 토큰과 스타일을 근거로 최소 변경만 수행하고 문서 부재를 보고하라.
- 신규 페이지, 신규 범용 pattern, 광범위한 variant가 필요하면 작은 수정으로 간주하지 마라.
