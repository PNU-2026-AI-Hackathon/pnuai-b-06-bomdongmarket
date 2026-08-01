# UI 구현 체크리스트

## 변경 전

- [ ] git 상태와 기존 사용자 변경 파일을 기록했다.
- [ ] 적용되는 모든 `AGENTS.md`를 읽었다.
- [ ] `DESIGN_SYSTEM.md`와 `UX_GUIDELINES.md`의 관련 규칙을 추출했다.
- [ ] 대상 route, page, 유사 화면, 관련 test를 찾았다.
- [ ] 공통 UI와 style helper를 이름과 역할로 검색했다.
- [ ] 변경 대상과 제외 대상을 정했다.

## 구조와 재사용

- [ ] 기존 Button, Input, Modal, Card, Badge, 상태 컴포넌트를 우선 사용했다.
- [ ] 기존 props, composition, variant로 해결 가능한지 먼저 확인했다.
- [ ] 한 화면의 주요 Primary Action이 명확하다.
- [ ] 새 범용 컴포넌트는 둘 이상의 실제 사용 맥락과 안정적인 contract가 있다.
- [ ] 새 pattern이 필요하면 이유와 `DESIGN_SYSTEM.md` 변경이 함께 있다.

## 스타일

- [ ] semantic token과 프로젝트 typography, spacing, radius, shadow를 사용했다.
- [ ] raw hex, 임의 Tailwind 값, 임의 spacing/radius를 추가하지 않았다.
- [ ] 관련 없는 화면의 스타일이나 전역 스타일을 바꾸지 않았다.
- [ ] 기존 variant로 충분한데 새 variant를 만들지 않았다.

## 상태와 상호작용

- [ ] loading 중 중복 제출을 막고 진행 상태를 전달한다.
- [ ] empty 상태가 이유와 가능한 다음 행동을 제공한다.
- [ ] error 상태가 원인과 복구 행동을 제공한다.
- [ ] success 상태가 완료 결과와 다음 위치를 알린다.
- [ ] hover, focus-visible, active, disabled, loading이 의미와 동작에서 일치한다.
- [ ] 상태를 색상만으로 표현하지 않는다.

## 반응형과 접근성

- [ ] 모바일과 데스크톱에서 정보 순서와 Primary Action을 확인했다.
- [ ] 320px 폭, 긴 텍스트, overflow, touch target을 확인했다.
- [ ] semantic element, heading, label, accessible name을 확인했다.
- [ ] keyboard만으로 도달·실행·취소할 수 있다.
- [ ] dialog와 비동기 전환의 focus 이동·복귀가 올바르다.
- [ ] validation error와 도움말이 해당 입력에 연결되어 있다.

## 검증

- [ ] lint를 실행했다.
- [ ] 실제 typecheck script 또는 설치된 로컬 compiler를 실행했다.
- [ ] 관련 test를 실행했다.
- [ ] build를 실행했다.
- [ ] 기존 실패와 이번 변경으로 생긴 실패를 구분했다.
