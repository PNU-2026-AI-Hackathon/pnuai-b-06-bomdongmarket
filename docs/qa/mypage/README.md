# 마이페이지 MVP 화면 검증 기록

검증일: 2026-08-09

## 재현 조건

1. `cd farmbroker-web && VITE_USE_MOCKS=true npm run dev -- --host 127.0.0.1`
2. 목 로그인 화면에서 긴 이메일 `very-long-farmbroker-account-name-for-responsive-check@example.com`으로 로그인
3. 아래 경로와 CSS viewport에서 `document.documentElement.scrollWidth === window.innerWidth`와 페이지별 `h1` 1개를 확인

| 화면 | 경로 | CSS viewport | scrollWidth | 가로 이탈 요소 | h1 | 증거 |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| 마이페이지 모바일 | `/mypage` | 320px | 320px | 0 | 1 | [mypage-320.jpg](./mypage-320.jpg) |
| 계정 수정 200% 확대 대응 | `/mypage/profile` | 640px | 640px | 0 | 1 | [profile-200-percent-equivalent-640.jpg](./profile-200-percent-equivalent-640.jpg) |
| 회원탈퇴 모바일 | `/mypage/withdraw` | 320px | 320px | 0 | 1 | [withdraw-320.jpg](./withdraw-320.jpg) |
| 마이페이지 데스크톱 | `/mypage` | 1280px | 1280px | 0 | 1 | [mypage-desktop-1280.jpg](./mypage-desktop-1280.jpg) |

1280px 물리 화면을 200%로 확대하면 레이아웃에 노출되는 CSS viewport가 640px이 되므로, 확대 대응 캡처는 640 CSS px로 고정해 같은 반응형 조건을 재현했다.

## 키보드와 상태 검증

- `MyPage.test.tsx`: `계정 정보 수정 → 회원 탈퇴 → 로그아웃` 탭 순서
- `ProfileEditPage.test.tsx`: 닉네임 입력 후 `Enter` 제출
- `WithdrawPage.test.tsx`: 탭 이동, `Space` 동의, `Enter` 제출
- 같은 테스트 모음에서 loading, eligibility 오류·재시도, 계약 차단, 최종 `409`, 비밀번호 오류, 중복 제출 방지, 성공 후 홈 안내를 검증

전체 프론트 검증은 다음 명령으로 재현한다.

```bash
sh .agents/skills/frontend-design-system-bootstrap/scripts/validate-frontend.sh farmbroker-web
```
