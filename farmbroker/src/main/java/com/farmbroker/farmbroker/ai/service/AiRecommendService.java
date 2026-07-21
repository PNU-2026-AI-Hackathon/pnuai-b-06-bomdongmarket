package com.farmbroker.farmbroker.ai.service;

import com.farmbroker.farmbroker.ai.client.GeminiClient;
import com.farmbroker.farmbroker.ai.domain.AiRecommendation;
import com.farmbroker.farmbroker.ai.domain.RecommendedCrop;
import com.farmbroker.farmbroker.ai.dto.AiRecommendOutcome;
import com.farmbroker.farmbroker.ai.dto.AiRecommendRequest;
import com.farmbroker.farmbroker.ai.dto.AiRecommendResponse;
import com.farmbroker.farmbroker.ai.dto.GeminiRecommendOutput;
import com.farmbroker.farmbroker.ai.dto.ProfitEstimateResponse;
import com.farmbroker.farmbroker.ai.prompt.RecommendPromptBuilder;
import com.farmbroker.farmbroker.profit.ProfitCalculator;
import com.farmbroker.farmbroker.profit.SpaceInputs;
import com.farmbroker.farmbroker.ai.repository.AiRecommendationRepository;
import com.farmbroker.farmbroker.common.exception.BusinessException;
import com.farmbroker.farmbroker.common.exception.ErrorCode;
import com.farmbroker.farmbroker.crop.domain.Crop;
import com.farmbroker.farmbroker.crop.repository.CropRepository;
import com.farmbroker.farmbroker.space.domain.Space;
import com.farmbroker.farmbroker.matching.support.SpaceSummary;
import com.farmbroker.farmbroker.matching.support.SpaceContractAdapter;
import com.farmbroker.farmbroker.user.domain.User;
import com.farmbroker.farmbroker.user.repository.UserRepository;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.core.JacksonException;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

// AI 작물/공간 활용 추천 로직 (structured output 방식).
// 흐름: 공간 검증 → 검증된 작물 백과사전 전체를 Gemini에 제공 → structured JSON 추천 →
//   의미 검증 → 추천 이력 저장(crop_id 연결) → 응답.
// Gemini 장애(AI_TIMEOUT/AI_QUOTA_EXCEEDED) 시 같은 공간의 최근 저장 결과를 fallback으로 반환한다.
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AiRecommendService {

    private static final Logger log = LoggerFactory.getLogger(AiRecommendService.class);

    private final GeminiClient geminiClient;
    private final RecommendPromptBuilder promptBuilder;
    private final AiRecommendationRepository aiRecommendationRepository;
    private final CropRepository cropRepository;
    private final UserRepository userRepository;
    private final SpaceContractAdapter spaceContractAdapter; // BE2 SpaceService 계약 제공 시 교체
    private final EntityManager entityManager;
    private final ObjectMapper objectMapper;
    private final ProfitCalculator profitCalculator; // structured 추천 후 서버가 직접 호출하는 결정론적 수익 계산기

    @Transactional
    public AiRecommendOutcome recommend(Long userId, AiRecommendRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        SpaceSummary space = spaceContractAdapter.getSummaryById(request.getSpaceId()); // 미존재 시 SPACE_NOT_FOUND
        if (space.isDeleted()) {
            throw new BusinessException(ErrorCode.SPACE_NOT_FOUND); // 삭제된 공간은 본 모듈에서 404 처리 (status는 무관)
        }

        List<Crop> crops = cropRepository.findAll();
        Map<Long, Crop> cropById = crops.stream()
                .collect(Collectors.toMap(Crop::getId, Function.identity()));

        String prompt = promptBuilder.build(space, request.getPreferredCrop(),
                request.getPurpose(), request.getAdditionalInfo(), toCatalogJson(crops));

        GeminiRecommendOutput output;
        try {
            output = callStructuredAndParse(prompt, cropById.keySet());
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
            Crop crop = cropById.get(item.cropId());
            recommendation.addRecommendedCrop(RecommendedCrop.builder()
                    .crop(crop)
                    .cropName(crop.getName())
                    .reason(item.reason().trim())
                    .displayOrder(order++)
                    .build());
        }
        aiRecommendationRepository.save(recommendation);

        return new AiRecommendOutcome(toResponse(recommendation, space), false);
    }

    // Structured output을 파싱하고 의미 검증한다. 형식 또는 의미 오류 시 1회만 재시도하며,
    // 그래도 실패하면 AI_RESPONSE_INVALID. 호출 자체의 실패(타임아웃/쿼터)는 GeminiClient가 던진다.
    private GeminiRecommendOutput callStructuredAndParse(String prompt, Set<Long> validCropIds) {
        for (int attempt = 0; attempt < 2; attempt++) {
            String text = geminiClient.generateStructured(prompt);
            try {
                GeminiRecommendOutput output = objectMapper.readValue(text, GeminiRecommendOutput.class);
                if (isValidOutput(output, validCropIds)) {
                    return output;
                }
                log.warn("[AI 추천] 파싱은 됐으나 추천 작물이 비어 있음 (attempt {}): {}", attempt, text);
            } catch (JacksonException e) {
                log.warn("[AI 추천] 최종 응답 JSON 파싱 실패 (attempt {}): {}", attempt, text);
            }
        }
        throw new BusinessException(ErrorCode.AI_RESPONSE_INVALID);
    }

    private boolean isValidOutput(GeminiRecommendOutput output, Set<Long> validCropIds) {
        if (output == null || output.recommendedCrops() == null
                || output.recommendedCrops().size() < 2 || output.recommendedCrops().size() > 3
                || output.layoutSuggestion() == null || output.layoutSuggestion().isBlank()
                || output.cautions() == null) {
            return false;
        }
        Set<Long> recommendedIds = output.recommendedCrops().stream()
                .map(GeminiRecommendOutput.CropItem::cropId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        return recommendedIds.size() == output.recommendedCrops().size()
                && validCropIds.containsAll(recommendedIds)
                && output.recommendedCrops().stream()
                .allMatch(item -> item.reason() != null && !item.reason().isBlank());
    }

    // 후보 조회 결과 — 추천 판단에 필요한 요약 필드. null 값이 있을 수 있어 LinkedHashMap 사용(Map.of는 null 불가)
    private Map<String, Object> cropSummaryMap(Crop crop) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", crop.getId());
        map.put("name", crop.getName());
        map.put("category", crop.getCategory());
        map.put("difficulty", crop.getDifficulty().name());
        map.put("growingPeriodDays", crop.getGrowingPeriodDays());
        map.put("avgPricePerKg", crop.getAvgPricePerKg());
        return map;
    }

    private Map<String, Object> cropDetailMap(Crop crop) {
        Map<String, Object> map = cropSummaryMap(crop);
        map.put("optimalTempMin", crop.getOptimalTempMin());
        map.put("optimalTempMax", crop.getOptimalTempMax());
        map.put("optimalHumidity", crop.getOptimalHumidity());
        map.put("lightRequirement", crop.getLightRequirement() != null ? crop.getLightRequirement().name() : null);
        map.put("yieldPerSqmKg", crop.getYieldPerSqmKg());
        map.put("description", crop.getDescription());
        return map;
    }

    private String toCatalogJson(List<Crop> crops) {
        try {
            return objectMapper.writeValueAsString(crops.stream().map(this::cropDetailMap).toList());
        } catch (JacksonException e) {
            throw new BusinessException(ErrorCode.AI_RESPONSE_INVALID);
        }
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
        return AiRecommendResponse.of(recommendation, space.getId(), items,
                fromJson(recommendation.getCautionsJson()), buildProfitEstimate(recommendation, space));
    }

    // 대표 작물(추천 순서상 계산기가 지원하는 첫 작물)로 서버가 수익을 계산한다.
    // 공간 면적·월세는 DB 값을 쓰고, 재배 파라미터가 없는 항목은 SpaceInputs의 표준 가정값을 사용한다(응답에 노출).
    // 지원 작물(수익 계산기 데이터에 존재)이 없으면 null — 프론트는 이 경우 계산 근거 카드를 숨긴다.
    private ProfitEstimateResponse buildProfitEstimate(AiRecommendation recommendation, SpaceSummary space) {
        if (space.getArea() == null || space.getArea().doubleValue() <= 0) {
            return null;
        }
        SpaceInputs inputs = SpaceInputs.fromSpace(
                space.getArea().doubleValue(),
                space.getMonthlyRent() != null ? space.getMonthlyRent() : 0.0);
        return recommendation.getRecommendedCrops().stream()
                .map(RecommendedCrop::getCropName)
                .filter(profitCalculator::supports)
                .findFirst()
                .map(cropName -> ProfitEstimateResponse.from(profitCalculator.estimate(inputs, cropName)))
                .orElse(null);
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
