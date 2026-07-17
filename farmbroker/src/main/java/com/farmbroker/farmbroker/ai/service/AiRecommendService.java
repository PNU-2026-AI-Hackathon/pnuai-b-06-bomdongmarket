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
import com.farmbroker.farmbroker.crop.domain.CropDifficulty;
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
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

// AI 작물/공간 활용 추천 로직 (function calling 방식).
// 흐름: 공간 검증 → 도구 선언과 함께 Gemini 호출 →
//   모델이 search_crops/get_crop_detail 로 백과사전을 스스로 조회 → 최종 추천(JSON) →
//   파싱 → 추천 이력 저장(작물명이 백과사전에 있으면 crop_id 연결) → 응답.
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

    @Transactional
    public AiRecommendOutcome recommend(Long userId, AiRecommendRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        SpaceSummary space = spaceContractAdapter.getSummaryById(request.getSpaceId()); // 미존재 시 SPACE_NOT_FOUND
        if (space.isDeleted()) {
            throw new BusinessException(ErrorCode.SPACE_NOT_FOUND); // 삭제된 공간은 본 모듈에서 404 처리 (status는 무관)
        }

        // 최종 추천의 cropName을 백과사전과 연결(crop_id)하기 위한 이름→엔티티 맵
        Map<String, Crop> cropByName = cropRepository.findAll().stream()
                .collect(Collectors.toMap(Crop::getName, Function.identity()));

        String prompt = promptBuilder.build(space, request.getPreferredCrop(),
                request.getPurpose(), request.getAdditionalInfo());

        GeminiRecommendOutput output;
        try {
            output = callWithToolsAndParse(prompt);
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

    // 도구를 제공한 상태로 Gemini를 호출하고 최종 JSON을 파싱한다. 파싱 실패 시 1회 재시도(도구 루프 전체 재실행),
    // 그래도 실패하면 AI_RESPONSE_INVALID. 호출 자체의 실패(타임아웃/쿼터)는 GeminiClient가 던진다.
    private GeminiRecommendOutput callWithToolsAndParse(String prompt) {
        List<Map<String, Object>> tools = buildToolDeclarations();
        for (int attempt = 0; attempt < 2; attempt++) {
            String text = geminiClient.generateWithTools(prompt, tools, this::executeTool);
            try {
                GeminiRecommendOutput output = objectMapper.readValue(stripFences(text), GeminiRecommendOutput.class);
                if (output.recommendedCrops() != null && !output.recommendedCrops().isEmpty()) {
                    return output;
                }
                log.warn("[AI 추천] 파싱은 됐으나 추천 작물이 비어 있음 (attempt {}): {}", attempt, text);
            } catch (JacksonException e) {
                log.warn("[AI 추천] 최종 응답 JSON 파싱 실패 (attempt {}): {}", attempt, text);
            }
        }
        throw new BusinessException(ErrorCode.AI_RESPONSE_INVALID);
    }

    // ── 도구 정의 ────────────────────────────────────────────────────────────
    // Gemini에게 넘길 함수 선언(JSON 스키마). 모델은 이 설명을 보고 언제 무엇을 호출할지 스스로 판단한다.
    private List<Map<String, Object>> buildToolDeclarations() {
        Map<String, Object> searchCrops = Map.of(
                "name", "search_crops",
                "description", "백과사전에서 재배 가능한 작물 후보를 조회한다. 카테고리나 난이도로 필터링할 수 있고, 인자 없이 호출하면 전체를 반환한다.",
                "parameters", Map.of(
                        "type", "object",
                        "properties", Map.of(
                                "category", Map.of("type", "string",
                                        "description", "작물 카테고리 (잎채소, 허브, 과채류, 새싹채소 중 하나)"),
                                "difficulty", Map.of("type", "string",
                                        "enum", List.of("EASY", "NORMAL", "HARD"),
                                        "description", "재배 난이도")
                        )
                )
        );
        Map<String, Object> getCropDetail = Map.of(
                "name", "get_crop_detail",
                "description", "특정 작물의 상세 재배 조건(적정 온습도, 광량, ㎡당 수확량, kg당 단가 등)을 조회한다.",
                "parameters", Map.of(
                        "type", "object",
                        "properties", Map.of(
                                "cropName", Map.of("type", "string", "description", "조회할 작물 이름")
                        ),
                        "required", List.of("cropName")
                )
        );
        return List.of(searchCrops, getCropDetail);
    }

    // ── 도구 실행 (GeminiClient 콜백) ─────────────────────────────────────────
    // 모델이 요청한 함수를 실제 백과사전(DB)으로 실행해 결과를 반환한다.
    private Object executeTool(String functionName, JsonNode args) {
        return switch (functionName) {
            case "search_crops" -> searchCropsTool(args);
            case "get_crop_detail" -> getCropDetailTool(args);
            default -> Map.of("error", "알 수 없는 함수: " + functionName);
        };
    }

    private Object searchCropsTool(JsonNode args) {
        String category = textOrNull(args, "category");
        CropDifficulty difficulty = parseDifficulty(textOrNull(args, "difficulty"));
        return cropRepository.search(null, category, difficulty).stream()
                .map(this::cropSummaryMap)
                .toList();
    }

    private Object getCropDetailTool(JsonNode args) {
        String cropName = textOrNull(args, "cropName");
        if (cropName == null) {
            return Map.of("error", "cropName이 필요합니다.");
        }
        return cropRepository.findByName(cropName)
                .map(this::cropDetailMap)
                .orElseGet(() -> Map.of("found", false, "cropName", cropName));
    }

    // 후보 조회 결과 — 추천 판단에 필요한 요약 필드. null 값이 있을 수 있어 LinkedHashMap 사용(Map.of는 null 불가)
    private Map<String, Object> cropSummaryMap(Crop crop) {
        Map<String, Object> map = new LinkedHashMap<>();
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

    private String textOrNull(JsonNode args, String field) {
        JsonNode node = args.path(field);
        return node.isMissingNode() || node.isNull() || node.asText().isBlank() ? null : node.asText().trim();
    }

    // 잘못된 난이도 문자열은 필터 미적용(null)으로 관대하게 처리한다 (도구 인자이므로 예외 대신 무시)
    private CropDifficulty parseDifficulty(String difficulty) {
        if (difficulty == null) {
            return null;
        }
        try {
            return CropDifficulty.valueOf(difficulty.toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    // responseMimeType JSON mode는 도구와 동시 사용이 어려워 텍스트로 받으므로, 마크다운 펜스를 방어한다
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
