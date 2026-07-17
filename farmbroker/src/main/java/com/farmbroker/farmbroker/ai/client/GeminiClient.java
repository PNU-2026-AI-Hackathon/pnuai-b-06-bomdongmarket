package com.farmbroker.farmbroker.ai.client;

import com.farmbroker.farmbroker.common.exception.BusinessException;
import com.farmbroker.farmbroker.common.exception.ErrorCode;
import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.net.http.HttpClient;
import java.time.Duration;
import java.util.List;
import java.util.Map;

// Gemini API 호출을 격리하는 클라이언트.
// 서비스 로직이 외부 API의 요청/응답 형식을 모르게 해 모델 교체·모킹·테스트를 쉽게 한다.
// ObjectMapper는 Boot 4 기본인 Jackson 3(tools.jackson) 빈을 주입받는다 (Jackson 2 자동 설정은 Boot 4에서 제거됨).
// - 타임아웃: connect 3s / read 15s → 초과 시 AI_TIMEOUT(504) (function calling은 왕복마다 15s 적용)
// - 429 → AI_QUOTA_EXCEEDED, 그 외 API 오류/응답 구조 이상 → AI_RESPONSE_INVALID
// - API 키는 GEMINI_API_KEY 환경변수로 주입 (커밋 금지)
@Component
public class GeminiClient {

    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    @Getter
    private final String model;

    public GeminiClient(ObjectMapper objectMapper,
                        @Value("${gemini.api-key:}") String apiKey,
                        @Value("${gemini.model:gemini-2.5-flash}") String model,
                        @Value("${gemini.base-url:https://generativelanguage.googleapis.com}") String baseUrl) {
        this.objectMapper = objectMapper;
        this.model = model;

        JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(
                HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(3)).build());
        requestFactory.setReadTimeout(Duration.ofSeconds(15));

        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(requestFactory)
                .defaultHeader("x-goog-api-key", apiKey)
                .build();
    }

    public String generateStructured(String prompt) {
        JsonNode parts = callGenerateContent(Map.of(
                        "contents", List.of(Map.of(
                                "role", "user",
                                "parts", List.of(Map.of("text", prompt)))),
                        "generationConfig", buildGenerationConfig()))
                .path("candidates").path(0).path("content").path("parts");
        return extractText(parts);
    }

    private Map<String, Object> buildGenerationConfig() {
        Map<String, Object> cropItemSchema = Map.of(
                "type", "object",
                "properties", Map.of(
                        "cropId", Map.of("type", "integer", "description", "후보 목록의 작물 ID"),
                        "reason", Map.of("type", "string", "description", "공간 조건에 근거한 추천 이유")
                ),
                "required", List.of("cropId", "reason")
        );
        Map<String, Object> responseSchema = Map.of(
                "type", "object",
                "properties", Map.of(
                        "recommendedCrops", Map.of(
                                "type", "array", "minItems", 2, "maxItems", 3,
                                "items", cropItemSchema),
                        "layoutSuggestion", Map.of("type", "string"),
                        "cautions", Map.of(
                                "type", "array", "items", Map.of("type", "string"))
                ),
                "required", List.of("recommendedCrops", "layoutSuggestion", "cautions")
        );
        return Map.of(
                "responseMimeType", "application/json",
                "responseSchema", responseSchema,
                "temperature", 0.2,
                "maxOutputTokens", 2048,
                "thinkingConfig", Map.of("thinkingBudget", 0)
        );
    }

    // 공통 POST — 예외를 도메인 에러 코드로 변환한다
    private JsonNode callGenerateContent(Map<String, Object> requestBody) {
        String responseBody;
        try {
            responseBody = restClient.post()
                    .uri("/v1beta/models/{model}:generateContent", model)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(requestBody)
                    .retrieve()
                    .body(String.class);
        } catch (HttpStatusCodeException e) {
            if (e.getStatusCode().value() == 429) {
                throw new BusinessException(ErrorCode.AI_QUOTA_EXCEEDED);
            }
            throw new BusinessException(ErrorCode.AI_RESPONSE_INVALID);
        } catch (ResourceAccessException e) {
            throw new BusinessException(ErrorCode.AI_TIMEOUT); // connect/read 타임아웃·네트워크 단절
        }
        try {
            return objectMapper.readTree(responseBody);
        } catch (JacksonException e) {
            throw new BusinessException(ErrorCode.AI_RESPONSE_INVALID);
        }
    }

    // 응답 parts의 모든 text 파트를 이어붙인다
    private String extractText(JsonNode parts) {
        StringBuilder sb = new StringBuilder();
        for (JsonNode part : parts) {
            if (part.has("text")) {
                sb.append(part.path("text").asText());
            }
        }
        if (sb.isEmpty()) {
            throw new BusinessException(ErrorCode.AI_RESPONSE_INVALID);
        }
        return sb.toString();
    }
}
