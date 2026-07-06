package com.farmbroker.farmbroker.ai.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;

// Gemini가 반환하는 JSON 본문을 역직렬화하는 내부 DTO.
// 모델이 프롬프트에 명시한 형식({recommendedCrops, layoutSuggestion, cautions})과 1:1 대응한다.
@JsonIgnoreProperties(ignoreUnknown = true)
public record GeminiRecommendOutput(
        List<CropItem> recommendedCrops,
        String layoutSuggestion,
        List<String> cautions
) {

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record CropItem(String cropName, String reason) {
    }
}
