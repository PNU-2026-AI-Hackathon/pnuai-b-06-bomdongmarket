package com.farmbroker.farmbroker.ai.dto;

import com.farmbroker.farmbroker.ai.domain.AiRecommendation;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

// AI 추천 응답의 data 필드 DTO.
// 작물 항목의 cropId/expectedYieldKg/avgPricePerKg는 백과사전 매칭 시에만 값이 있고 아니면 null —
// 프론트가 이 값을 수익 예측(POST /predictions) 입력 기본값으로 넘겨 원클릭 흐름을 만들 수 있다.
@Getter
public class AiRecommendResponse {

    private final Long recommendationId;
    private final Long spaceId;
    private final List<RecommendedCropItem> recommendedCrops;
    private final String layoutSuggestion;
    private final List<String> cautions;
    private final LocalDateTime createdAt;

    private AiRecommendResponse(Long recommendationId, Long spaceId, List<RecommendedCropItem> recommendedCrops,
                                String layoutSuggestion, List<String> cautions, LocalDateTime createdAt) {
        this.recommendationId = recommendationId;
        this.spaceId = spaceId;
        this.recommendedCrops = recommendedCrops;
        this.layoutSuggestion = layoutSuggestion;
        this.cautions = cautions;
        this.createdAt = createdAt;
    }

    // cautions는 엔티티에 JSON 문자열로 저장돼 있어 서비스에서 파싱해 넘긴다
    public static AiRecommendResponse of(AiRecommendation recommendation, Long spaceId,
                                         List<RecommendedCropItem> recommendedCrops, List<String> cautions) {
        return new AiRecommendResponse(
                recommendation.getId(),
                spaceId,
                recommendedCrops,
                recommendation.getLayoutSuggestion(),
                cautions,
                recommendation.getCreatedAt()
        );
    }

    @Getter
    public static class RecommendedCropItem {

        private final String cropName;
        private final Long cropId;
        private final String reason;
        private final Integer expectedYieldKg;
        private final Integer avgPricePerKg;

        public RecommendedCropItem(String cropName, Long cropId, String reason,
                                   Integer expectedYieldKg, Integer avgPricePerKg) {
            this.cropName = cropName;
            this.cropId = cropId;
            this.reason = reason;
            this.expectedYieldKg = expectedYieldKg;
            this.avgPricePerKg = avgPricePerKg;
        }
    }
}
