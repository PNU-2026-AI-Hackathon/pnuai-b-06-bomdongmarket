package com.farmbroker.farmbroker.ai.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.NoArgsConstructor;

// AI 추천(POST /ai/recommend) 요청 바디 DTO.
// 자유 입력 필드의 길이 제한은 프롬프트 인젝션 완화를 겸한다.
@Getter
@NoArgsConstructor
@Schema(description = "Gemini 작물 추천 요청")
public class AiRecommendRequest {

    @Schema(description = "추천을 실행할 공간 ID", example = "1", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "공간 ID는 필수입니다.")
    private Long spaceId;

    @Schema(description = "사용자가 우선 검토하고 싶은 작물명", example = "상추", maxLength = 30, nullable = true)
    @Size(max = 30, message = "희망 작물은 30자 이하여야 합니다.")
    private String preferredCrop;

    @Schema(description = "재배 목적", example = "소규모 부업", maxLength = 100, nullable = true)
    @Size(max = 100, message = "목적은 100자 이하여야 합니다.")
    private String purpose;

    @Schema(description = "추천에 반영할 추가 조건", example = "초기 비용을 최대한 줄이고 싶습니다.", maxLength = 500, nullable = true)
    @Size(max = 500, message = "추가 정보는 500자 이하여야 합니다.")
    private String additionalInfo;
}
