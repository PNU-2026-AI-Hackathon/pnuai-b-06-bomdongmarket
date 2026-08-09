---
name: frontend-design-system-bootstrap
description: Analyze an existing frontend without replacing its brand or visual direction, extract repeated UI patterns into a project-specific design system, document the audit and UX rules, implement tokens and shared components, connect frontend rules to AGENTS.md and the PR template, and pilot the system on one representative screen. Use for UI consistency audits, first-time or renewed design tokens, consolidation of duplicated common UI, creation of DESIGN_SYSTEM.md and UX_GUIDELINES.md, frontend guidance in AGENTS.md, or a one-screen design-system pilot. Do not use for copy-only edits to one button, ordinary small UI features, single-screen changes that already follow an established design system, or unsolicited full-screen redesigns.
---

# Frontend Design System Bootstrap

기존 브랜드와 화면 분위기를 유지하면서 실제 코드의 반복 패턴을 규칙화하고, 대표 화면 하나에서만 검증하라. 분석 문서만 만들고 끝내지 말고 구현과 검증까지 완료하라.

## 핵심 원칙

- 시작 시 `git status --short`와 diff를 확인하고 기존 사용자 변경을 별도로 기록하라. 삭제, 덮어쓰기, `git reset`, `git clean`, 강제 checkout을 금지하라.
- 현재 라이브러리, 스타일 방식, 폴더 구조를 우선 사용하라. 새 의존성은 필수 근거가 있을 때만 제안하고 임의로 설치하지 마라.
- 빈도와 핵심 화면 근거 없이 raw hex, 임의 spacing, 임의 radius, 새로운 시각 취향을 추가하지 마라.
- 전면 재설계와 일괄 마이그레이션을 금지하라. 대표 화면 하나와 그 화면에 필요한 공통 기반만 변경하라.
- 기존 오류와 이번 변경에서 생긴 오류를 명령, 파일, 최초 관찰 시점으로 구분하라.

## 실행 절차

순서를 바꾸거나 구현 단계를 생략하지 마라.

1. **작업 상태 보존** — 저장소 루트, 현재 브랜치, `git status --short`, staged/unstaged diff를 확인하라. 사용자 변경 파일을 작업 금지 목록이 아니라 충돌 방지 기준선으로 기록하라.
2. **스택과 구조 파악** — `package.json`, lockfile, 빌드 도구, 프레임워크, 스타일 도구, TypeScript 설정, 테스트 도구, 실제 scripts를 확인하라. 존재하지 않는 명령을 추측하지 마라.
3. **UI 표면 조사** — 라우트, 페이지, 레이아웃, 전역/모듈 스타일, 공통 컴포넌트, 아이콘·이미지·폰트 사용을 조사하라. `scripts/scan-ui-patterns.sh`를 실행해 반복 후보를 수집하라.
4. **감사와 기준선 기록** — `references/ui-audit-checklist.md`와 `references/accessibility-checklist.md`를 읽고 일관성, UX, 접근성, 반응형 문제를 감사하라. 구현 전 `scripts/validate-frontend.sh`를 실행해 기존 실패를 기록하라.
5. **규칙 추출** — 반복 빈도, 공통 컴포넌트 사용, 핵심 사용자 흐름을 근거로 색상, 타이포그래피, 간격, radius, elevation, 상태, breakpoint, 콘텐츠 규칙을 추출하라. `references/design-system-guidelines.md`를 적용하라.
6. **UI 감사 문서 작성** — `assets/UI_AUDIT.template.md`를 사용해 `docs/UI_AUDIT.md`를 작성하라. 각 발견에 증거, 영향, 우선순위, 제안 범위를 포함하라.
7. **디자인 시스템 문서 작성** — `assets/DESIGN_SYSTEM.template.md`를 사용해 `docs/DESIGN_SYSTEM.md`를 작성하라. 현재 상태, 토큰, 컴포넌트 계약, 사용/금지 예시, 마이그레이션 상태를 명시하라.
8. **UX 지침 작성** — `assets/UX_GUIDELINES.template.md`를 사용해 `docs/UX_GUIDELINES.md`를 작성하라. 내비게이션, 피드백, 폼, 빈/오류/로딩 상태, 접근성, 반응형, 콘텐츠 지침을 포함하라.
9. **토큰 구현** — 현재 스타일 방식에 맞춰 토큰을 구현하라. 기존 값의 의미를 보존하고 raw 값의 신규 확산을 막아라.
10. **공통 UI 규격화** — 중복 빈도와 대표 화면 필요성을 기준으로 공통 컴포넌트만 통합하라. variant, size, state, 접근성 계약을 문서와 코드에서 일치시켜라.
11. **AGENTS.md 연결** — 기존 모든 `AGENTS.md`를 먼저 읽고 보존하라. 관련 범위의 파일에 짧은 프론트엔드 규칙과 두 지침 문서 링크를 추가하라. 파일이 없으면 저장소 구조에 맞는 최소 파일만 생성하라.
12. **PR 체크리스트 연결** — 기존 PR 템플릿의 문구와 구조를 보존하면서 UI 체크리스트를 추가하라. 템플릿이 없을 때만 저장소 관례에 맞는 최소 템플릿을 생성하라.
13. **대표 화면 선정** — 사용자 가치, 패턴 대표성, 변경 위험, 테스트 가능성을 비교해 화면 하나를 선정하고 근거를 `UI_AUDIT.md`에 기록하라.
14. **대표 화면 시험 적용** — 선정 화면에만 토큰과 규격화 컴포넌트를 적용하라. 필요한 테스트를 갱신하고 다른 페이지의 시각 구조를 재설계하지 마라.
15. **검증** — `scripts/validate-frontend.sh`로 lint, typecheck, test, build를 실행하라. 선언된 script 또는 실제 로컬 도구만 사용하고, 없는 검사는 `SKIP`으로 보고하라. 구현 전 기준선과 비교해 신규 실패를 수정하라.
16. **결과 보고** — 변경 파일, 추출 근거, 대표 화면, 검증 결과, 기존 오류, 신규 오류 해결 여부, 페이지별 후속 마이그레이션 계획을 보고하라.

## 완료 조건

- 세 문서, 토큰 구현, 공통 UI 규격, AGENTS/PR 연결, 대표 화면 구현이 서로 모순되지 않아야 한다.
- 사용자 변경사항이 그대로 보존되어야 한다.
- 검증 실패는 기존/신규/미실행으로 분류되어야 한다.
- 후속 계획은 한 번에 전체 페이지를 바꾸지 않는 작은 화면 단위여야 한다.
