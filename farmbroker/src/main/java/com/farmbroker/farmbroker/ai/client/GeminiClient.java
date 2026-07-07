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
// - responseMimeType=application/json으로 JSON 응답 강제
// - 타임아웃: connect 3s / read 15s → 초과 시 AI_TIMEOUT(504)
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

    // 프롬프트를 보내고 모델이 생성한 JSON 문자열(본문 텍스트)을 반환한다
    public String generateJson(String prompt) {
        Map<String, Object> requestBody = Map.of(
                "contents", List.of(Map.of("parts", List.of(Map.of("text", prompt)))),
                "generationConfig", Map.of("responseMimeType", "application/json")
        );

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
            // connect/read 타임아웃 및 네트워크 단절
            throw new BusinessException(ErrorCode.AI_TIMEOUT);
        }

        try {
            JsonNode text = objectMapper.readTree(responseBody)
                    .path("candidates").path(0)
                    .path("content").path("parts").path(0)
                    .path("text");
            if (text.isMissingNode() || text.asText().isBlank()) {
                throw new BusinessException(ErrorCode.AI_RESPONSE_INVALID);
            }
            return text.asText();
        } catch (JacksonException e) {
            throw new BusinessException(ErrorCode.AI_RESPONSE_INVALID);
        }
    }
}
