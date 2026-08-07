package com.farmbroker.farmbroker.ai.client;

import tools.jackson.databind.JsonNode;

// Gemini가 tool calling 한 턴에서 돌려준 결과.
// 툴을 고르면 functionName/args가 채워지고, 도구 없이 그냥 답하면 text가 채워진다(둘 중 하나만).
// 결과 데이터를 다시 모델에 넣지 않는 단일 호출 구조라 응답이 빠르고 수치 환각이 생기지 않는다.
public record GeminiToolCall(String functionName, JsonNode args, String text) {

    public static GeminiToolCall ofFunction(String functionName, JsonNode args) {
        return new GeminiToolCall(functionName, args, null);
    }

    public static GeminiToolCall ofText(String text) {
        return new GeminiToolCall(null, null, text);
    }

    public boolean hasFunctionCall() {
        return functionName != null && !functionName.isBlank();
    }
}
