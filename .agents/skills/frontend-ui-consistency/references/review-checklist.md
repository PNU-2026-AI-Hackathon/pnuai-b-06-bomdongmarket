# UI 리뷰 체크리스트

## 리뷰 방식

- 요구사항과 diff 범위를 먼저 확인하고 변경 파일 밖의 전면 개선을 요구하지 않는다.
- correctness, 사용자 흐름, 접근성, 회귀 위험을 우선하고 개인 취향은 finding으로 만들지 않는다.
- 각 finding에 파일과 좁은 line 범위, 재현 조건, 사용자 영향, 기존 디자인 시스템 근거를 포함한다.
- 기존 오류나 diff 밖의 문제는 이번 PR이 악화하지 않는 한 별도로 구분한다.

## 검토 항목

### 디자인 시스템

- 토큰 대신 raw hex 또는 임의 Tailwind 값을 추가했는가?
- 기존 공통 컴포넌트나 variant를 우회했는가?
- 페이지 로컬 Button, Input, Modal 등 범용 UI를 재구현했는가?
- 새 pattern 또는 variant가 문서와 실제 재사용 근거 없이 추가됐는가?
- 한 화면의 Primary Action이 중복되거나 모호해졌는가?

### 사용자 상태

- loading 중 중복 실행, layout shift, 불명확한 진행 상태가 생기는가?
- empty, error, success 상태에 설명과 다음 행동이 있는가?
- 오류가 사라지지 않거나 성공 후 데이터·화면 상태가 어긋나는가?
- hover, focus, active, disabled, loading 상태가 동작과 일치하는가?
- 색상만으로 의미나 상태를 전달하는가?

### 반응형

- 모바일과 데스크톱에서 핵심 정보나 Primary Action이 사라지는가?
- 고정 폭, overflow, 긴 문자열, zoom에서 내용 손실이 있는가?
- 프로젝트 breakpoint와 다른 임의 기준을 추가했는가?
- 터치 대상과 인접 동작 간 간격이 충분한가?

### 접근성

- semantic element, heading 순서, label, accessible name이 올바른가?
- keyboard로 도달·실행·취소할 수 있는가?
- focus-visible, dialog focus trap/return, route 전환 focus가 올바른가?
- validation error와 상태 변화가 보조 기술에 전달되는가?

### 검증

- 변경된 동작을 관련 test가 검증하는가?
- lint, typecheck, 관련 test, build 결과가 보고됐는가?
- 실패가 기존 오류인지 이번 변경의 회귀인지 근거가 있는가?

## 심각도

- **P0**: 데이터 손실, 보안·안전 문제, 핵심 흐름 완전 차단
- **P1**: 주요 기능 오작동, keyboard 사용 불가, 다수 사용자에게 발생하는 반응형 회귀
- **P2**: 제한된 조건의 UX·접근성·일관성 문제
- **P3**: 명확한 유지보수 위험이 있으나 현재 동작 영향이 작음

finding이 없으면 없다고 말하고 남은 검증 공백만 짧게 보고한다.
