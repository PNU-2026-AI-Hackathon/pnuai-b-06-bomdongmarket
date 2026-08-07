package com.farmbroker.farmbroker.chat.service;

import com.farmbroker.farmbroker.ai.client.GeminiClient;
import com.farmbroker.farmbroker.ai.client.GeminiToolCall;
import com.farmbroker.farmbroker.chat.ChatToolCatalog;
import com.farmbroker.farmbroker.chat.dto.ChatRequest;
import com.farmbroker.farmbroker.chat.dto.ChatResponse;
import com.farmbroker.farmbroker.crop.service.CropService;
import com.farmbroker.farmbroker.matching.service.MatchingService;
import com.farmbroker.farmbroker.space.service.SpaceService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ObjectNode;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

// 챗봇의 툴 디스패치 검증. Gemini 호출은 스텁하고, 고른 툴이 올바른 서비스·파라미터로 이어지는지만 본다.
class ChatServiceTest {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private GeminiClient geminiClient;
    private CropService cropService;
    private SpaceService spaceService;
    private MatchingService matchingService;
    private ChatService chatService;

    @BeforeEach
    void setUp() {
        geminiClient = mock(GeminiClient.class);
        cropService = mock(CropService.class);
        spaceService = mock(SpaceService.class);
        matchingService = mock(MatchingService.class);
        chatService = new ChatService(geminiClient, cropService, spaceService, matchingService);
    }

    private ChatRequest ask(String message) {
        ChatRequest request = new ChatRequest();
        ReflectionTestUtils.setField(request, "message", message);
        return request;
    }

    private void stubToolCall(String name, ObjectNode args) {
        when(geminiClient.selectTool(anyString(), anyString(), any()))
                .thenReturn(GeminiToolCall.ofFunction(name, args));
    }

    @Test
    void 난이도_조건이_작물_검색_서비스로_전달된다() {
        ObjectNode args = MAPPER.createObjectNode().put("difficulty", "EASY");
        stubToolCall(ChatToolCatalog.SEARCH_CROPS, args);
        when(cropService.getCrops(null, null, "EASY")).thenReturn(List.of());

        ChatResponse response = chatService.ask(1L, ask("키우기 쉬운 작물 뭐가 있어?"));

        assertEquals(ChatResponse.ResultType.CROPS, response.resultType());
        verify(cropService).getCrops(null, null, "EASY");
    }

    @Test
    void 빈_문자열_파라미터는_필터_없음으로_정규화된다() {
        ObjectNode args = MAPPER.createObjectNode().put("keyword", "   ").put("category", "허브");
        stubToolCall(ChatToolCatalog.SEARCH_CROPS, args);
        when(cropService.getCrops(null, "허브", null)).thenReturn(List.of());

        chatService.ask(1L, ask("허브 알려줘"));

        verify(cropService).getCrops(null, "허브", null);
    }

    @Test
    void 받은_매칭_조회는_인증된_사용자_ID로만_실행된다() {
        ObjectNode args = MAPPER.createObjectNode().put("direction", "RECEIVED");
        stubToolCall(ChatToolCatalog.GET_MY_MATCHINGS, args);
        when(matchingService.getReceived(42L)).thenReturn(List.of());

        ChatResponse response = chatService.ask(42L, ask("나한테 온 신청 있어?"));

        assertEquals(ChatResponse.ResultType.RECEIVED_MATCHINGS, response.resultType());
        verify(matchingService).getReceived(42L);
        verify(matchingService, never()).getMyRequests(anyLong());
    }

    @Test
    void 방향이_없으면_내가_보낸_신청을_조회한다() {
        stubToolCall(ChatToolCatalog.GET_MY_MATCHINGS, MAPPER.createObjectNode());
        when(matchingService.getMyRequests(7L)).thenReturn(List.of());

        ChatResponse response = chatService.ask(7L, ask("내 매칭 어떻게 됐어?"));

        assertEquals(ChatResponse.ResultType.MY_MATCHINGS, response.resultType());
        verify(matchingService).getMyRequests(7L);
    }

    @Test
    void 툴을_고르지_않으면_텍스트로_답한다() {
        when(geminiClient.selectTool(anyString(), anyString(), any()))
                .thenReturn(GeminiToolCall.ofText("스마트팜은 실내에서 작물을 기르는 방식이에요."));

        ChatResponse response = chatService.ask(1L, ask("스마트팜이 뭐야?"));

        assertEquals(ChatResponse.ResultType.TEXT, response.resultType());
        assertEquals("스마트팜은 실내에서 작물을 기르는 방식이에요.", response.message());
        assertNull(response.crops());
        verify(cropService, never()).getCrops(any(), any(), any());
    }

    @Test
    void 알_수_없는_툴_이름은_안내_문장으로_처리한다() {
        stubToolCall("deleteEverything", MAPPER.createObjectNode());

        ChatResponse response = chatService.ask(1L, ask("전부 지워줘"));

        assertEquals(ChatResponse.ResultType.TEXT, response.resultType());
        assertNotNull(response.message());
        verify(cropService, never()).getCrops(any(), any(), any());
        verify(spaceService, never()).getList(any(), any(), any(), any(), eq(0), eq(10));
    }
}
