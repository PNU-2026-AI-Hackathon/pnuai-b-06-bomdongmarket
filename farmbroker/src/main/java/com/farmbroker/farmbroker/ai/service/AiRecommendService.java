package com.farmbroker.farmbroker.ai.service;

import com.farmbroker.farmbroker.ai.client.GeminiClient;
import com.farmbroker.farmbroker.ai.domain.AiRecommendation;
import com.farmbroker.farmbroker.ai.domain.RecommendedCrop;
import com.farmbroker.farmbroker.ai.dto.AiRecommendOutcome;
import com.farmbroker.farmbroker.ai.dto.AiRecommendRequest;
import com.farmbroker.farmbroker.ai.dto.AiRecommendResponse;
import com.farmbroker.farmbroker.ai.dto.GeminiRecommendOutput;
import com.farmbroker.farmbroker.ai.prompt.RecommendPromptBuilder;
import com.farmbroker.farmbroker.ai.repository.AiRecommendationRepository;
import com.farmbroker.farmbroker.common.exception.BusinessException;
import com.farmbroker.farmbroker.common.exception.ErrorCode;
import com.farmbroker.farmbroker.crop.domain.Crop;
import com.farmbroker.farmbroker.crop.repository.CropRepository;
import com.farmbroker.farmbroker.space.domain.Space;
import com.farmbroker.farmbroker.space.dto.SpaceSummary;
import com.farmbroker.farmbroker.space.service.SpaceService;
import com.farmbroker.farmbroker.user.domain.User;
import com.farmbroker.farmbroker.user.repository.UserRepository;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.core.JacksonException;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

// AI 작물/공간 활용 추천 로직.
// 흐름: 공간 검증 → 프롬프트 조립(백과사전 후보 포함) → Gemini 호출 →
// JSON 파싱(실패 시 1회 재시도) → 추천 이력 저장(작물명이 백과사전에 있으면 crop_id 연결) → 응답.
// Gemini 장애(AI_TIMEOUT/AI_QUOTA_EXCEEDED) 시 같은 공간의 최근 저장 결과를 fallback으로 반환한다 (시연 안정성).
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AiRecommendService {

    private final GeminiClient geminiClient;
    private final RecommendPromptBuilder promptBuilder;
    private final AiRecommendationRepository aiRecommendationRepository;
    private final CropRepository cropRepository;
    private final UserRepository userRepository;
    private final SpaceService spaceService;
    private final EntityManager entityManager;
    private final ObjectMapper objectMapper;

    @Transactional
    public AiRecommendOutcome recommend(Long userId, AiRecommendRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        SpaceSummary space = spaceService.getSummaryById(request.getSpaceId()); // 미존재 시 SPACE_NOT_FOUND
        if (space.isDeleted()) {
            throw new BusinessException(ErrorCode.SPACE_NOT_FOUND); // 삭제된 공간은 본 모듈에서 404 처리 (status는 무관)
        }

        List<Crop> crops = cropRepository.findAll();
        Map<String, Crop> cropByName = crops.stream()
                .collect(Collectors.toMap(Crop::getName, Function.identity()));
        String prompt = promptBuilder.build(space, request.getPreferredCrop(), request.getPurpose(),
                request.getAdditionalInfo(), crops.stream().map(Crop::getName).toList());

        GeminiRecommendOutput output;
        try {
            output = callAndParse(prompt);
        } catch (BusinessException e) {
            AiRecommendOutcome fallback = tryFallback(e.getErrorCode(), space);
            if (fallback != null) {
                return fallback;
            }
            throw e;
        }

        AiRecommendation recommendation = AiRecommendation.builder()
                .space(entityManager.getReference(Space.class, space.getId()))
                .user(user)
                .preferredCrop(request.getPreferredCrop())
                .purpose(request.getPurpose())
                .additionalInfo(request.getAdditionalInfo())
                .layoutSuggestion(output.layoutSuggestion())
                .cautionsJson(toJson(output.cautions()))
                .model(geminiClient.getModel())
                .build();

        int order = 0;
        for (GeminiRecommendOutput.CropItem item : output.recommendedCrops()) {
            String name = item.cropName() == null ? "" : item.cropName().trim();
            recommendation.addRecommendedCrop(RecommendedCrop.builder()
                    .crop(cropByName.get(name)) // 백과사전에 없는 작물이면 null (이름만 저장)
                    .cropName(name)
                    .reason(item.reason())
                    .displayOrder(order++)
                    .build());
        }
        aiRecommendationRepository.save(recommendation);

        return new AiRecommendOutcome(toResponse(recommendation, space), false);
    }

    // Gemini 호출 + JSON 파싱. 파싱 실패(형식 오류·작물 목록 누락) 시 1회 재호출하고,
    // 그래도 실패하면 AI_RESPONSE_INVALID. 호출 자체의 실패(타임아웃/쿼터)는 GeminiClient가 던진다.
    private GeminiRecommendOutput callAndParse(String prompt) {
        for (int attempt = 0; attempt < 2; attempt++) {
            String text = geminiClient.generateJson(prompt);
            try {
                GeminiRecommendOutput output = objectMapper.readValue(stripFences(text), GeminiRecommendOutput.class);
                if (output.recommendedCrops() != null && !output.recommendedCrops().isEmpty()) {
                    return output;
                }
            } catch (JacksonException ignored) {
                // 재시도 1회
            }
        }
        throw new BusinessException(ErrorCode.AI_RESPONSE_INVALID);
    }

    // responseMimeType을 JSON으로 강제하지만, 모델이 마크다운 펜스(```json)를 붙이는 경우를 방어
    private String stripFences(String text) {
        String stripped = text.strip();
        if (stripped.startsWith("```")) {
            int firstLineEnd = stripped.indexOf('\n');
            stripped = firstLineEnd >= 0 ? stripped.substring(firstLineEnd + 1) : "";
            int fenceEnd = stripped.lastIndexOf("```");
            if (fenceEnd >= 0) {
                stripped = stripped.substring(0, fenceEnd);
            }
        }
        return stripped.strip();
    }

    // Gemini 장애 시 같은 공간의 최근 저장 결과 재사용 — 없으면 null을 반환해 원래 예외를 그대로 던지게 한다
    private AiRecommendOutcome tryFallback(ErrorCode errorCode, SpaceSummary space) {
        if (errorCode != ErrorCode.AI_TIMEOUT && errorCode != ErrorCode.AI_QUOTA_EXCEEDED) {
            return null;
        }
        return aiRecommendationRepository.findTopBySpaceIdOrderByCreatedAtDesc(space.getId())
                .map(saved -> new AiRecommendOutcome(toResponse(saved, space), true))
                .orElse(null);
    }

    private AiRecommendResponse toResponse(AiRecommendation recommendation, SpaceSummary space) {
        List<AiRecommendResponse.RecommendedCropItem> items = recommendation.getRecommendedCrops().stream()
                .map(rc -> new AiRecommendResponse.RecommendedCropItem(
                        rc.getCropName(),
                        rc.getCrop() != null ? rc.getCrop().getId() : null,
                        rc.getReason(),
                        expectedYieldKg(rc.getCrop(), space.getArea()),
                        rc.getCrop() != null ? rc.getCrop().getAvgPricePerKg() : null
                ))
                .toList();
        return AiRecommendResponse.of(recommendation, space.getId(), items, fromJson(recommendation.getCautionsJson()));
    }

    // 예상 수확량(kg) = 백과사전의 ㎡당 수확량 × 공간 면적 (매칭된 작물에만 제공)
    private Integer expectedYieldKg(Crop crop, BigDecimal area) {
        if (crop == null || crop.getYieldPerSqmKg() == null || area == null) {
            return null;
        }
        return (int) Math.round(crop.getYieldPerSqmKg() * area.doubleValue());
    }

    private String toJson(List<String> cautions) {
        try {
            return objectMapper.writeValueAsString(cautions != null ? cautions : List.of());
        } catch (JacksonException e) {
            throw new BusinessException(ErrorCode.AI_RESPONSE_INVALID);
        }
    }

    private List<String> fromJson(String cautionsJson) {
        if (cautionsJson == null || cautionsJson.isBlank()) {
            return List.of();
        }
        try {
            return objectMapper.readValue(cautionsJson, new TypeReference<List<String>>() {
            });
        } catch (JacksonException e) {
            return List.of(); // 저장된 이력이 깨져 있어도 응답 전체를 실패시키지 않는다
        }
    }
}
