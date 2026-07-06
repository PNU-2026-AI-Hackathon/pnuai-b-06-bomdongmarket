package com.farmbroker.farmbroker.ai.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

// AI 추천(POST /ai/recommend) 요청 바디 DTO.
// 자유 입력 필드의 길이 제한은 프롬프트 인젝션 완화를 겸한다.
@Getter
@NoArgsConstructor
public class AiRecommendRequest {

    @NotNull(message = "공간 ID는 필수입니다.")
    private Long spaceId;

    @Size(max = 30, message = "희망 작물은 30자 이하여야 합니다.")
    private String preferredCrop;

    @Size(max = 100, message = "목적은 100자 이하여야 합니다.")
    private String purpose;

    @Size(max = 500, message = "추가 정보는 500자 이하여야 합니다.")
    private String additionalInfo;
}
