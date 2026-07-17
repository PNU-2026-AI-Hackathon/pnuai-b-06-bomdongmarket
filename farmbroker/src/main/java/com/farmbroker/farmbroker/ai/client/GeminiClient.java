package com.farmbroker.farmbroker.ai.client;

import com.farmbroker.farmbroker.common.exception.BusinessException;
import com.farmbroker.farmbroker.common.exception.ErrorCode;
import lombok.Getter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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
import java.util.ArrayList;
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

    private static final Logger log = LoggerFactory.getLogger(GeminiClient.class);

    // function calling 왕복 상한 — 모델이 도구를 계속 호출해 무한 루프가 되는 것을 방어한다.
    // 모델이 작물마다 상세 조회를 반복할 수 있어 여유 있게 둔다 (각 왕복은 thinking 없이 1초 내외).
    private static final int MAX_TOOL_TURNS = 12;

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
        // function calling은 thinking이 켜진 왕복을 여러 번 하므로 개별 read 여유를 넉넉히 둔다
        requestFactory.setReadTimeout(Duration.ofSeconds(40));

        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(requestFactory)
                .defaultHeader("x-goog-api-key", apiKey)
                .build();
    }

    // ── function calling ─────────────────────────────────────────────────────
    // 프롬프트 + 도구 선언을 주고, 모델이 함수 호출을 요청하면 executor로 실행해 결과를 돌려주는
    // 멀티턴 루프를 수행한다. 모델이 더 이상 함수를 호출하지 않고 텍스트로 답하면 그 텍스트를 반환한다.
    // GeminiClient는 어떤 함수가 있는지/무엇을 하는지 전혀 모른다 — 선언과 실행 모두 호출측이 제공.
    public String generateWithTools(String prompt,
                                    List<Map<String, Object>> functionDeclarations,
                                    GeminiToolExecutor executor) {
        List<Object> contents = new ArrayList<>();
        contents.add(Map.of("role", "user", "parts", List.of(Map.of("text", prompt))));

        Object tools = List.of(Map.of("functionDeclarations", functionDeclarations));

        for (int turn = 0; turn < MAX_TOOL_TURNS; turn++) {
            // thinking은 켜 둔다(끄면 도구 사용 판단·최종 JSON 품질이 떨어짐). 대신 read timeout으로 지연을 견딘다.
            JsonNode content = callGenerateContent(Map.of("contents", contents, "tools", tools))
                    .path("candidates").path(0).path("content");
            JsonNode parts = content.path("parts");

            List<JsonNode> functionCalls = new ArrayList<>();
            for (JsonNode part : parts) {
                if (part.has("functionCall")) {
                    functionCalls.add(part.path("functionCall"));
                }
            }

            // 함수 호출이 없으면 최종 답변 — parts의 text를 모아 반환한다
            if (functionCalls.isEmpty()) {
                return extractText(parts);
            }

            // ① 모델의 함수 호출 턴(content)을 대화 이력에 그대로 되붙인다 (Gemini 규약)
            contents.add(objectMapper.convertValue(content, Map.class));

            // ② 각 함수를 실행해 functionResponse 파트를 만든다 (한 응답에 여러 호출이 올 수 있음 — 전부 처리)
            List<Object> responseParts = new ArrayList<>();
            for (JsonNode functionCall : functionCalls) {
                String name = functionCall.path("name").asText();
                JsonNode args = functionCall.path("args");
                log.info("[Gemini function calling] 모델이 호출: {}({})", name, args);
                Object result = executor.execute(name, args);
                responseParts.add(Map.of("functionResponse",
                        Map.of("name", name, "response", Map.of("result", result))));
            }
            contents.add(Map.of("role", "user", "parts", responseParts));
        }

        // 상한을 넘도록 도구 호출만 반복하고 결론을 못 냄
        throw new BusinessException(ErrorCode.AI_RESPONSE_INVALID);
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
