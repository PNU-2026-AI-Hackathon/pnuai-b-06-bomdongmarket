package com.farmbroker.farmbroker.matching.controller;

import com.farmbroker.farmbroker.common.response.ApiResponse;
import com.farmbroker.farmbroker.matching.dto.MatchingApplyRequest;
import com.farmbroker.farmbroker.matching.dto.MatchingApplyResponse;
import com.farmbroker.farmbroker.matching.service.MatchingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

// 매칭 관련 엔드포인트 컨트롤러.
// 얇게 유지: 토큰의 userId(@AuthenticationPrincipal — 백엔드 1 JWT 필터 규약)와
// 요청 DTO를 서비스에 위임하고 ApiResponse로 감싸 반환만 한다.
@RestController
@RequestMapping("/matchings")
@RequiredArgsConstructor
public class MatchingController {

    private final MatchingService matchingService;

    // POST /api/matchings — 매칭 신청 (FARMER 전용)
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<MatchingApplyResponse> apply(@RequestBody @Valid MatchingApplyRequest request,
                                                    @AuthenticationPrincipal Long userId) {
        MatchingApplyResponse response = matchingService.apply(userId, request);
        return ApiResponse.success("매칭 신청이 완료되었습니다.", response);
    }
}
