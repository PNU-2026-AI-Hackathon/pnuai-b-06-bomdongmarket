## Frontend skill requirements

- 기존 프론트엔드의 디자인 시스템을 처음 구축하거나 전면적으로 규칙화할 때 `$frontend-design-system-bootstrap`을 사용한다.
- 프론트엔드 페이지, 폼, 레이아웃 또는 공통 UI 컴포넌트를 추가·수정·리뷰할 때 `$frontend-ui-consistency`를 사용한다.
- 프론트엔드 수정 전에 다음 문서를 확인한다.
  - [`docs/DESIGN_SYSTEM.md`](../docs/DESIGN_SYSTEM.md)
  - [`docs/UX_GUIDELINES.md`](../docs/UX_GUIDELINES.md)
- 요청받지 않은 화면을 재설계하지 않는다.
- 기존 공통 컴포넌트와 디자인 토큰을 우선 사용한다.
- 새로운 UI 패턴을 도입하면 관련 디자인 문서도 함께 갱신한다.

## Frontend implementation contract

- 적용 범위: 이 파일이 위치한 `farmbroker-web/**`
- 구현 기준:
  - [`docs/DESIGN_SYSTEM.md`](../docs/DESIGN_SYSTEM.md)
  - [`docs/UX_GUIDELINES.md`](../docs/UX_GUIDELINES.md)
- 문서화된 근거 없이 raw color 또는 arbitrary spacing/radius/shadow를 새로 추가하지 않는다.
- 화면별로 작은 범위에서 마이그레이션하고 관련 공통 컴포넌트의 variant, state, 접근성 계약을 우선 사용한다.
- 검증: 저장소 루트에서 `sh .agents/skills/frontend-design-system-bootstrap/scripts/validate-frontend.sh farmbroker-web`
