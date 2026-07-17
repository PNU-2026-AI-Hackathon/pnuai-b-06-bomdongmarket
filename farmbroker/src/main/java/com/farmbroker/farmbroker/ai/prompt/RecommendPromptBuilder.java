package com.farmbroker.farmbroker.ai.prompt;

import com.farmbroker.farmbroker.matching.support.SpaceSummary;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

// AI 추천 프롬프트 조립기. 프롬프트 수정이 잦을 것이므로 서비스 코드와 분리한다.
// function calling 방식: 작물 후보를 프롬프트에 미리 넣지 않고, 모델이 필요할 때
// search_crops / get_crop_detail 도구로 직접 조회하도록 유도한다.
// 사용자 입력(additionalInfo 등)은 길이 제한(DTO 검증) + 프롬프트 하단 배치로 인젝션 영향 최소화.
@Component
public class RecommendPromptBuilder {

    public String build(SpaceSummary space, String preferredCrop, String purpose, String additionalInfo) {
        return """
                당신은 도심 스마트팜 컨설턴트입니다. 아래 공간 조건을 분석하여
                재배에 적합한 작물 2~3개와 공간 배치안, 주의사항을 제안하세요.

                작물을 추천하기 전에 아래 도구로 백과사전의 실제 데이터를 확인하세요.
                - search_crops: 조건(카테고리·난이도)에 맞는 재배 가능 작물 후보를 조회합니다.
                - get_crop_detail: 특정 작물의 상세 재배 조건(적정 온습도·광량·수확량·단가)을 조회합니다.

                도구는 효율적으로 사용하세요:
                1) 먼저 search_crops로 후보 목록을 확인하고 (보통 1~2회면 충분),
                2) 최종 추천 후보로 좁힌 작물 2~3개에 대해서만 get_crop_detail로 상세를 확인한 뒤,
                3) 더 조회할 필요가 없으면 즉시 아래 JSON 형식으로 최종 답변하세요.
                추천하는 작물의 cropName은 반드시 백과사전 조회 결과에 있는 이름과 정확히 일치시키세요.

                [공간 조건]
                - 면적: %s㎡ / 층: %s / 월세: %s원
                - 수도: %s, 전기: %s, 환기: %s
                - 설명: %s

                [사용자 요청]
                - 희망 작물: %s
                - 목적: %s
                - 추가 정보: %s

                도구 조회를 마친 뒤, 반드시 아래 JSON 형식으로만 최종 응답하세요. 다른 텍스트를 포함하지 마세요.
                {
                  "recommendedCrops": [{"cropName": "...", "reason": "..."}],
                  "layoutSuggestion": "...",
                  "cautions": ["..."]
                }
                """.formatted(
                space.getArea(),
                space.getFloor() != null ? space.getFloor() + "층" : "정보 없음",
                space.getMonthlyRent(),
                yesNo(space.isHasWater()),
                yesNo(space.isHasElectricity()),
                yesNo(space.isHasVentilation()),
                orDefault(space.getDescription()),
                orDefault(preferredCrop),
                orDefault(purpose),
                orDefault(additionalInfo)
        );
    }

    private String yesNo(boolean value) {
        return value ? "있음" : "없음";
    }

    private String orDefault(String value) {
        return StringUtils.hasText(value) ? value : "없음";
    }
}
