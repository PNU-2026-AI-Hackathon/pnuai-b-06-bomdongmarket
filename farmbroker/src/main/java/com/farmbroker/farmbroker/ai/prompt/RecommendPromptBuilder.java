package com.farmbroker.farmbroker.ai.prompt;

import com.farmbroker.farmbroker.matching.support.SpaceSummary;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

// AI 추천 프롬프트 조립기. 프롬프트 수정이 잦을 것이므로 서비스 코드와 분리한다.
// 서버가 검증된 작물 백과사전 데이터를 제공하고 Gemini는 그 후보 안에서만 추천한다.
// 사용자 입력(additionalInfo 등)은 길이 제한(DTO 검증) + 프롬프트 하단 배치로 인젝션 영향 최소화.
@Component
public class RecommendPromptBuilder {

    public String build(SpaceSummary space, String preferredCrop, String purpose,
                        String additionalInfo, String cropCatalogJson) {
        return """
                당신은 도심 스마트팜 컨설턴트입니다. 아래 공간 조건을 분석하여
                재배에 적합한 작물 2~3개와 공간 배치안, 주의사항을 제안하세요.

                반드시 아래 작물 백과사전 후보 안에서만 2~3개를 추천하세요.
                가격과 수확량은 비교 참고 정보일 뿐 예상 매출이나 수익을 계산하지 마세요.

                [공간 조건]
                - 면적: %s㎡ / 층: %s / 월세: %s원
                - 수도: %s, 전기: %s, 환기: %s
                - 설명: %s

                [사용자 요청]
                - 희망 작물: %s
                - 목적: %s
                - 추가 정보: %s

                [작물 백과사전 후보 JSON]
                %s

                반드시 아래 JSON 형식으로만 최종 응답하세요. 다른 텍스트를 포함하지 마세요.
                {
                  "recommendedCrops": [{"cropId": 1, "reason": "..."}],
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
                orDefault(additionalInfo),
                cropCatalogJson
        );
    }

    private String yesNo(boolean value) {
        return value ? "있음" : "없음";
    }

    private String orDefault(String value) {
        return StringUtils.hasText(value) ? value : "없음";
    }
}
