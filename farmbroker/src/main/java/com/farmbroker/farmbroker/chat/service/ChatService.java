package com.farmbroker.farmbroker.chat.service;

import com.farmbroker.farmbroker.ai.client.GeminiClient;
import com.farmbroker.farmbroker.ai.client.GeminiToolCall;
import com.farmbroker.farmbroker.chat.ChatToolCatalog;
import com.farmbroker.farmbroker.chat.dto.ChatRequest;
import com.farmbroker.farmbroker.chat.dto.ChatResponse;
import com.farmbroker.farmbroker.crop.dto.CropListResponse;
import com.farmbroker.farmbroker.crop.service.CropService;
import com.farmbroker.farmbroker.matching.dto.MyMatchingResponse;
import com.farmbroker.farmbroker.matching.dto.ReceivedMatchingResponse;
import com.farmbroker.farmbroker.matching.service.MatchingService;
import com.farmbroker.farmbroker.space.dto.SpaceListResponse;
import com.farmbroker.farmbroker.space.service.SpaceService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import tools.jackson.databind.JsonNode;

import java.math.BigDecimal;
import java.util.List;

// 자연어 조회 챗봇 (이슈 #52).
// 흐름: 사용자 질문 → Gemini가 툴+파라미터만 선택(모델 호출 1회) → 서버가 기존 서비스로 실제 조회 → 결과 반환.
//
// 설계 의도
// - 조회 결과를 다시 모델에 넣어 요약시키지 않는다. 왕복이 늘어 느려지고 모델이 수치를 지어낼 수 있다.
//   안내 문장은 서버가 실제 결과 건수로 만든다.
// - 툴 실행은 반드시 기존 서비스 계층을 그대로 탄다. 조회 권한·검증이 자동으로 적용되고,
//   모델이 엉뚱한 값을 만들어도 서비스가 막는다.
// - 매칭 조회는 인증된 userId만 사용한다 — 모델이 다른 사용자 ID를 지정할 방법 자체를 두지 않았다.
@Service
@RequiredArgsConstructor
public class ChatService {

    private static final Logger log = LoggerFactory.getLogger(ChatService.class);

    private static final String FALLBACK_TEXT = "조회할 내용을 이해하지 못했어요. 작물, 공간, 매칭 현황에 대해 물어봐 주세요.";

    private final GeminiClient geminiClient;
    private final CropService cropService;
    private final SpaceService spaceService;
    private final MatchingService matchingService;

    public ChatResponse ask(Long userId, ChatRequest request) {
        GeminiToolCall call = geminiClient.selectTool(
                ChatToolCatalog.SYSTEM_INSTRUCTION, request.getMessage(), ChatToolCatalog.declarations());

        if (!call.hasFunctionCall()) {
            String text = call.text();
            return ChatResponse.text(text == null || text.isBlank() ? FALLBACK_TEXT : text.trim());
        }

        JsonNode args = call.args();
        return switch (call.functionName()) {
            case ChatToolCatalog.SEARCH_CROPS -> searchCrops(args);
            case ChatToolCatalog.SEARCH_SPACES -> searchSpaces(args);
            case ChatToolCatalog.GET_MY_MATCHINGS -> myMatchings(userId, args);
            default -> {
                log.warn("[챗봇] 알 수 없는 툴 호출: {}", call.functionName());
                yield ChatResponse.text(FALLBACK_TEXT);
            }
        };
    }

    private ChatResponse searchCrops(JsonNode args) {
        List<CropListResponse> crops = cropService.getCrops(
                text(args, "keyword"), text(args, "category"), text(args, "difficulty"));
        String message = crops.isEmpty()
                ? "조건에 맞는 작물을 찾지 못했어요."
                : "조건에 맞는 작물 %d개를 찾았어요.".formatted(crops.size());
        return ChatResponse.crops(message, crops);
    }

    private ChatResponse searchSpaces(JsonNode args) {
        SpaceListResponse spaces = spaceService.getList(
                text(args, "keyword"),
                args.hasNonNull("minArea") ? BigDecimal.valueOf(args.path("minArea").asDouble()) : null,
                args.hasNonNull("maxRent") ? args.path("maxRent").asInt() : null,
                text(args, "sort"), 0, 10);
        int count = spaces.getContent() == null ? 0 : spaces.getContent().size();
        String message = count == 0
                ? "조건에 맞는 공간을 찾지 못했어요."
                : "조건에 맞는 공간 %d곳을 찾았어요.".formatted(count);
        return ChatResponse.spaces(message, spaces);
    }

    // 방향(SENT/RECEIVED)만 모델이 고르고, 대상 사용자는 항상 인증된 본인이다.
    private ChatResponse myMatchings(Long userId, JsonNode args) {
        if ("RECEIVED".equalsIgnoreCase(text(args, "direction"))) {
            List<ReceivedMatchingResponse> received = matchingService.getReceived(userId);
            String message = received.isEmpty()
                    ? "받은 매칭 신청이 없어요."
                    : "받은 매칭 신청 %d건이 있어요.".formatted(received.size());
            return ChatResponse.receivedMatchings(message, received);
        }
        List<MyMatchingResponse> sent = matchingService.getMyRequests(userId);
        String message = sent.isEmpty()
                ? "보낸 매칭 신청이 없어요."
                : "보낸 매칭 신청 %d건이 있어요.".formatted(sent.size());
        return ChatResponse.myMatchings(message, sent);
    }

    // 모델이 빈 문자열을 넣는 경우가 있어 null로 정규화한다(서비스의 "필터 없음"과 같은 의미)
    private String text(JsonNode args, String field) {
        if (args == null || !args.hasNonNull(field)) {
            return null;
        }
        String value = args.path(field).asString().trim();
        return value.isEmpty() ? null : value;
    }
}
