package com.farmbroker.farmbroker.matching.controller;

import com.farmbroker.farmbroker.common.response.ApiResponse;
import com.farmbroker.farmbroker.matching.dto.MatchingApplyRequest;
import com.farmbroker.farmbroker.matching.dto.MatchingApplyResponse;
import com.farmbroker.farmbroker.matching.dto.MatchingStatusResponse;
import com.farmbroker.farmbroker.matching.dto.MyMatchingResponse;
import com.farmbroker.farmbroker.matching.dto.ReceivedMatchingResponse;
import com.farmbroker.farmbroker.matching.service.MatchingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// 매칭 관련 엔드포인트 컨트롤러.
// 얇게 유지: 토큰의 userId(@AuthenticationPrincipal — 백엔드 1 JWT 필터 규약)와
// 요청 DTO를 서비스에 위임하고 ApiResponse로 감싸 반환만 한다.
@Tag(name = "매칭", description = "농부-공간 매칭 신청/수락/거절 API (인증 필요)")
@RestController
@RequestMapping("/matchings")
@RequiredArgsConstructor
public class MatchingController {

    private final MatchingService matchingService;

    // POST /api/matchings — 매칭 신청 (FARMER 전용)
    @Operation(summary = "매칭 신청 (FARMER 전용)")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<MatchingApplyResponse> apply(@RequestBody @Valid MatchingApplyRequest request,
                                                    @AuthenticationPrincipal Long userId) {
        MatchingApplyResponse response = matchingService.apply(userId, request);
        return ApiResponse.success("매칭 신청이 완료되었습니다.", response);
    }

    // GET /api/matchings/my-requests — 내가 신청한 매칭 목록 (farmer 시점)
    @Operation(summary = "내가 신청한 매칭 목록 조회 (farmer 시점)")
    @GetMapping("/my-requests")
    public ApiResponse<List<MyMatchingResponse>> getMyRequests(@AuthenticationPrincipal Long userId) {
        List<MyMatchingResponse> response = matchingService.getMyRequests(userId);
        return ApiResponse.success("내 신청 목록 조회에 성공했습니다.", response);
    }

    // GET /api/matchings/received — 내 공간들에 들어온 매칭 신청 목록 (owner 시점)
    @Operation(summary = "받은 매칭 신청 목록 조회 (공간 owner 시점)")
    @GetMapping("/received")
    public ApiResponse<List<ReceivedMatchingResponse>> getReceived(@AuthenticationPrincipal Long userId) {
        List<ReceivedMatchingResponse> response = matchingService.getReceived(userId);
        return ApiResponse.success("받은 신청 목록 조회에 성공했습니다.", response);
    }

    // PATCH /api/matchings/{matchingId}/accept — 신청 수락 (공간 owner 전용)
    @Operation(summary = "매칭 신청 수락 (공간 owner 전용)")
    @PatchMapping("/{matchingId}/accept")
    public ApiResponse<MatchingStatusResponse> accept(@PathVariable Long matchingId,
                                                      @AuthenticationPrincipal Long userId) {
        MatchingStatusResponse response = matchingService.accept(matchingId, userId);
        return ApiResponse.success("매칭 신청을 수락했습니다.", response);
    }

    // PATCH /api/matchings/{matchingId}/reject — 신청 거절 (공간 owner 전용)
    @Operation(summary = "매칭 신청 거절 (공간 owner 전용)")
    @PatchMapping("/{matchingId}/reject")
    public ApiResponse<MatchingStatusResponse> reject(@PathVariable Long matchingId,
                                                      @AuthenticationPrincipal Long userId) {
        MatchingStatusResponse response = matchingService.reject(matchingId, userId);
        return ApiResponse.success("매칭 신청을 거절했습니다.", response);
    }
}
