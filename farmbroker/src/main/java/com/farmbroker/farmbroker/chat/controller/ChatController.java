package com.farmbroker.farmbroker.chat.controller;

import com.farmbroker.farmbroker.chat.dto.ChatRequest;
import com.farmbroker.farmbroker.chat.dto.ChatResponse;
import com.farmbroker.farmbroker.chat.service.ChatService;
import com.farmbroker.farmbroker.common.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// 자연어 조회 챗봇 컨트롤러 (이슈 #52).
// 인증 필요 — SecurityConfig의 anyRequest().authenticated()를 그대로 따른다.
// 매칭 조회가 본인 데이터를 다루므로 비로그인 허용은 하지 않는다.
@Tag(name = "자연어 조회", description = "질문을 조회 도구로 변환해 실행하는 챗봇 API (로그인 필요)")
@RestController
@RequestMapping("/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    // POST /api/chat — 자연어 질문을 조회로 변환해 실행
    @Operation(
            summary = "자연어 조회",
            description = """
                    질문을 Gemini가 읽고 조회 도구(작물 검색 · 공간 검색 · 내 매칭 현황) 중 하나를 골라 실행합니다.
                    모델은 도구와 파라미터만 선택하고 실제 조회는 서버가 기존 API와 같은 서비스로 수행하므로,
                    응답의 목록 데이터는 각 조회 API와 동일하며 모델이 값을 지어낼 수 없습니다.
                    도구로 답할 수 없는 질문이면 resultType=TEXT로 짧은 안내 문장만 돌아갑니다.
                    이번 범위는 읽기 전용이며 매칭 신청 같은 쓰기 동작은 수행하지 않습니다.
                    """
    )
    @PostMapping
    public ApiResponse<ChatResponse> ask(@RequestBody @Valid ChatRequest request,
                                         @AuthenticationPrincipal Long userId) {
        return ApiResponse.success("조회가 완료되었습니다.", chatService.ask(userId, request));
    }
}
