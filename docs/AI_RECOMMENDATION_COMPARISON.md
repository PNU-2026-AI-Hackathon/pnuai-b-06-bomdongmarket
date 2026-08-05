# AI 추천 방식 비교

두 브랜치는 커밋 `ebaad77`을 공통 기준점으로 사용한다.

| 항목 | `codex/ai-gemini3-tools` | `codex/ai-structured-only` |
|---|---|---|
| 기본 모델 | `gemini-3-flash-preview` | `gemini-2.5-flash` |
| 작물 데이터 전달 | 모델이 DB 검색/상세 도구 호출 | 서버가 전체 백과사전을 프롬프트에 포함 |
| 최종 출력 | Function Calling + JSON Schema | JSON Schema |
| 정상 LLM 호출 수 | 2회 이상 | 1회 |
| 최대 호출 수 | 한 시도당 4회, 파싱 재시도 포함 | 최대 2회 |
| 장점 | 필요한 데이터와 조회 순서를 모델이 선택 | 빠르고 재현 가능하며 구현이 단순 |
| 단점 | preview 의존, 지연·토큰·실패 지점 증가 | 작물 데이터가 커지면 프롬프트가 증가 |

## 공통 출력 계약

```json
{
  "recommendedCrops": [
    { "cropId": 1, "reason": "추천 이유" }
  ],
  "layoutSuggestion": "텍스트 기반 배치 제안",
  "cautions": ["주의사항"]
}
```

두 방식 모두 추천 수 2~3개, 유효한 작물 ID, 중복 금지, 빈 설명 금지를 서버에서 검증한다.
외부 API와 응답 DTO는 기존 계약을 유지한다.

## 실행 설정

각 worktree에서 `.env.example`을 복사해 API 키를 설정한다.
공정한 비교를 위해서는 두 브랜치 모두 아래처럼 동일한 모델을 사용한다.

```dotenv
GEMINI_MODEL=gemini-3-flash-preview
```

Gemini 3 API 무료 티어가 프로젝트에서 허용되지 않으면 `codex/ai-structured-only`에서
`gemini-2.5-flash`를 사용한다.

2026-07-17 실제 API 확인 결과 `gemini-3-flash-preview` 무료 티어에서 `VALIDATED`
Function Calling과 JSON Schema를 함께 사용하고, call ID/thought signature를 보존한 뒤
최종 structured JSON을 받는 흐름이 정상 동작했다. `ANY` 모드는 JSON MIME과 함께 지원되지 않는다.

## 비교 지표

동일한 공간/사용자 요청을 각 10회 실행해 다음 값을 기록한다.

- 성공률과 fallback 비율
- 평균 및 p95 응답 시간
- 요청당 Gemini 호출 횟수
- JSON/의미 검증 실패율
- 추천 작물 ID 유효율
- tool 호출 횟수와 반복 상한 도달 여부
- Gemini usage metadata의 입력/출력 토큰

## 실시간 가격 API 연결 지점

가격 API가 확정되면 `MarketPriceProvider`를 추가해 단위가 정규화된 가격, 기준일,
조회 시각, 출처, stale 여부를 반환한다.

- structured-only: Gemini 호출 전에 서버가 가격을 배치 조회해 작물 컨텍스트에 병합한다.
- tool-calling: `get_market_prices(cropIds[])` 배치 도구를 최대 1회 추가한다.
- 예상 매출과 수익은 두 브랜치 모두 계산하지 않으며 별도 수익 예측 모듈이 담당한다.
