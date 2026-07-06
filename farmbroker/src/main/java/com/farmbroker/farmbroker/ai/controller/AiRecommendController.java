package com.farmbroker.farmbroker.ai.controller;

import com.farmbroker.farmbroker.ai.dto.AiRecommendOutcome;
import com.farmbroker.farmbroker.ai.dto.AiRecommendRequest;
import com.farmbroker.farmbroker.ai.dto.AiRecommendResponse;
import com.farmbroker.farmbroker.ai.service.AiRecommendService;
import com.farmbroker.farmbroker.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// AI 추천 엔드포인트 컨트롤러.
// 권한은 로그인만 요구(역할 제한 없음) — OWNER도 "내 공간에 뭘 키우면 좋을까"를 조회할 수 있게 열어둔다 (팀 확정).
@RestController
@RequestMapping("/ai")
@RequiredArgsConstructor
public class AiRecommendController {

    private final AiRecommendService aiRecommendService;

    // POST /api/ai/recommend — 작물 및 공간 활용 추천
    @PostMapping("/recommend")
    public ApiResponse<AiRecommendResponse> recommend(@RequestBody @Valid AiRecommendRequest request,
                                                      @AuthenticationPrincipal Long userId) {
        AiRecommendOutcome outcome = aiRecommendService.recommend(userId, request);
        String message = outcome.fallback() ? "이전 추천 결과를 표시합니다." : "AI 추천이 완료되었습니다.";
        return ApiResponse.success(message, outcome.response());
    }
}
