package com.farmbroker.farmbroker.ai.dto;

import com.farmbroker.farmbroker.ai.domain.AiRecommendation;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

// AI 추천 응답의 data 필드 DTO.
// 작물 항목의 cropId/expectedYieldKg/avgPricePerKg는 백과사전 매칭 시에만 값이 있고 아니면 null —
// 프론트가 이 값을 수익 예측(POST /predictions) 입력 기본값으로 넘겨 원클릭 흐름을 만들 수 있다.
@Getter
@Schema(description = "검증·저장된 AI 작물 추천 결과")
public class AiRecommendResponse {

    @Schema(description = "저장된 추천 이력 ID", example = "15")
    private final Long recommendationId;
    @Schema(description = "추천 대상 공간 ID", example = "1")
    private final Long spaceId;
    @Schema(description = "Gemini가 백과사전 후보 중 선택하고 서버가 검증한 작물 2~3개")
    private final List<RecommendedCropItem> recommendedCrops;
    @Schema(description = "텍스트 기반 재배 모듈 배치 제안", example = "벽면에 다단 재배대를 배치하고 중앙 작업 통로를 확보하세요.")
    private final String layoutSuggestion;
    @Schema(description = "공간과 추천 작물에 따른 운영 주의사항")
    private final List<String> cautions;
    @Schema(description = "추천 생성 또는 저장 시각", example = "2026-07-18T10:30:00")
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
    @Schema(description = "추천 작물 항목")
    public static class RecommendedCropItem {

        @Schema(description = "서버 백과사전의 작물명", example = "상추")
        private final String cropName;
        @Schema(description = "서버 백과사전의 작물 ID", example = "1")
        private final Long cropId;
        @Schema(description = "공간·사용자 조건에 근거해 Gemini가 생성한 추천 이유")
        private final String reason;
        @Schema(description = "서버 계산 예상 수확량(kg): ㎡당 수확량 × 공간 면적", example = "175")
        private final Integer expectedYieldKg;
        @Schema(description = "작물 데이터에 저장된 kg당 기준 단가. Gemini 생성값이 아님", example = "7000")
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
