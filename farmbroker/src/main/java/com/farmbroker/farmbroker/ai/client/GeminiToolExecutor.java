package com.farmbroker.farmbroker.ai.client;

import tools.jackson.databind.JsonNode;

// Gemini function calling에서 모델이 요청한 함수를 실제로 실행하는 콜백.
// GeminiClient가 도메인(crop 등)을 모르도록 격리하기 위한 인터페이스 —
// 클라이언트는 "함수 이름 + 인자(JSON)"만 넘기고, 실행 결과(JSON 직렬화 가능한 객체)를 돌려받는다.
@FunctionalInterface
public interface GeminiToolExecutor {

    // functionName: 모델이 호출한 함수 이름, args: 모델이 채운 인자(JsonNode)
    // 반환값은 functionResponse의 result로 그대로 직렬화되어 모델에게 전달된다.
    Object execute(String functionName, JsonNode args);
}
