package com.farmbroker.farmbroker.matching.controller;

import com.farmbroker.farmbroker.common.response.ApiResponse;
import com.farmbroker.farmbroker.matching.dto.ContractAgreeRequest;
import com.farmbroker.farmbroker.matching.dto.ContractResponse;
import com.farmbroker.farmbroker.matching.dto.ContractTermsRequest;
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
@Tag(name = "매칭", description = "농부-공간 매칭 신청/계약 협의 API (인증 필요)")
@RestController
@RequestMapping("/matchings")
@RequiredArgsConstructor
public class MatchingController {

    private final MatchingService matchingService;

    // POST /api/matchings — 매칭 신청 (로그인 필요, 계약이 확정되면 FARMER 역할이 부여됨)
    @Operation(summary = "매칭 신청 (로그인 필요)",
            description = "역할 제한 없이 로그인한 회원이면 신청할 수 있고, 양측이 계약에 동의하면 신청자에게 FARMER 역할이 부여된다.")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<MatchingApplyResponse> apply(@RequestBody @Valid MatchingApplyRequest request,
                                                    @AuthenticationPrincipal Long userId) {
        MatchingApplyResponse response = matchingService.apply(userId, request);
        return ApiResponse.success("매칭 신청이 완료되었습니다.", response);
    }

    // GET /api/matchings/my-requests — 내가 신청한 매칭 목록 (farmer 시점)
    @Operation(summary = "내가 신청한 매칭 목록 조회 (farmer 시점)",
            description = "spaceId를 주면 해당 공간에 보낸 신청만 반환한다 — 신청 상세 화면용.")
    @GetMapping("/my-requests")
    public ApiResponse<List<MyMatchingResponse>> getMyRequests(
            @RequestParam(required = false) Long spaceId,
            @AuthenticationPrincipal Long userId) {
        List<MyMatchingResponse> response = matchingService.getMyRequests(userId, spaceId);
        return ApiResponse.success("내 신청 목록 조회에 성공했습니다.", response);
    }

    // GET /api/matchings/sent — 헤더의 보낸 신청 알림 목록
    @Operation(summary = "보낸 매칭 신청 알림 목록 조회")
    @GetMapping("/sent")
    public ApiResponse<List<MyMatchingResponse>> getSentNotifications(@AuthenticationPrincipal Long userId) {
        List<MyMatchingResponse> response = matchingService.getSentNotifications(userId);
        return ApiResponse.success("보낸 신청 알림 조회에 성공했습니다.", response);
    }

    // GET /api/matchings/received — 내 공간들에 들어온 매칭 신청 목록 (owner 시점)
    @Operation(summary = "받은 매칭 신청 목록 조회 (공간 owner 시점)")
    @GetMapping("/received")
    public ApiResponse<List<ReceivedMatchingResponse>> getReceived(@AuthenticationPrincipal Long userId) {
        List<ReceivedMatchingResponse> response = matchingService.getReceived(userId);
        return ApiResponse.success("받은 신청 목록 조회에 성공했습니다.", response);
    }

    // PATCH /api/matchings/{matchingId}/dismiss — 현재 사용자의 받은/보낸 알림에서 감추기
    @Operation(summary = "매칭 신청 알림 감추기",
            description = "신청 당사자가 자신의 받은 또는 보낸 알림에서 감춘다. 신청·계약 상태와 상세 이력은 유지된다.")
    @PatchMapping("/{matchingId}/dismiss")
    public ApiResponse<Void> dismiss(@PathVariable Long matchingId,
                                     @AuthenticationPrincipal Long userId) {
        matchingService.dismissNotification(matchingId, userId);
        return ApiResponse.success("신청 알림을 목록에서 감췄습니다.", null);
    }

    // PATCH /api/matchings/{matchingId}/cancel — 신청 취소 (신청자 본인 전용)
    // DELETE가 아닌 PATCH — 행을 지우지 않고 CANCELED로 남겨 신청 이력을 보존한다.
    @Operation(summary = "매칭 신청 취소 (신청자 본인 전용)",
            description = "아직 계약이 확정·취소되지 않은(REQUESTED) 신청만 취소할 수 있고, 취소 후 같은 공간에 재신청할 수 있다.")
    @PatchMapping("/{matchingId}/cancel")
    public ApiResponse<MatchingStatusResponse> cancel(@PathVariable Long matchingId,
                                                      @AuthenticationPrincipal Long userId) {
        MatchingStatusResponse response = matchingService.cancel(matchingId, userId);
        return ApiResponse.success("매칭 신청을 취소했습니다.", response);
    }

    // ── 계약서 ───────────────────────────────────────────────────────────────
    // 조건 저장에 PUT을 쓰지 않는 이유: SecurityConfig의 CORS allowedMethods가
    // GET/POST/PATCH/DELETE/OPTIONS라 PUT을 쓰려면 공유 설정을 건드려야 한다.
    // 네 엔드포인트 모두 갱신된 계약서 전체를 반환해 프론트가 재조회하지 않게 한다.

    // GET /api/matchings/{matchingId}/contract — 계약서 조회 (당사자 둘만)
    @Operation(summary = "계약서 조회 (매칭 당사자 전용)",
            description = "양측 닉네임·공간 주소와 입력된 계약 조건, 동의 현황을 함께 반환한다. viewerRole로 요청자가 어느 쪽인지 알려준다.")
    @GetMapping("/{matchingId}/contract")
    public ApiResponse<ContractResponse> getContract(@PathVariable Long matchingId,
                                                     @AuthenticationPrincipal Long userId) {
        ContractResponse response = matchingService.getContract(matchingId, userId);
        return ApiResponse.success("계약서 조회에 성공했습니다.", response);
    }

    // PATCH /api/matchings/{matchingId}/contract — 계약 조건 저장 (공간 owner 전용)
    @Operation(summary = "계약 조건 저장 (공간 owner 전용)",
            description = "월세와 계약기간을 저장한다. 조건이 바뀌면 이미 받은 양측 동의는 초기화된다.")
    @PatchMapping("/{matchingId}/contract")
    public ApiResponse<ContractResponse> updateContractTerms(@PathVariable Long matchingId,
                                                             @RequestBody @Valid ContractTermsRequest request,
                                                             @AuthenticationPrincipal Long userId) {
        ContractResponse response = matchingService.updateContractTerms(matchingId, userId, request);
        return ApiResponse.success("계약 조건을 저장했습니다.", response);
    }

    // PATCH /api/matchings/{matchingId}/contract/agree — 계약 동의 (당사자 둘 다)
    @Operation(summary = "계약 동의 (매칭 당사자 전용)",
            description = "양측이 모두 동의하면 계약이 확정된다. 조건이 비어 있으면 동의할 수 없다. "
                    + "화면에서 조회한 뒤 조건이 바뀌었으면(termsVersion 불일치) 409로 거절하고 재조회를 요구한다.")
    @PatchMapping("/{matchingId}/contract/agree")
    public ApiResponse<ContractResponse> agreeContract(@PathVariable Long matchingId,
                                                       @RequestBody @Valid ContractAgreeRequest request,
                                                       @AuthenticationPrincipal Long userId) {
        ContractResponse response = matchingService.agreeContract(matchingId, userId, request.getTermsVersion());
        return ApiResponse.success("계약에 동의했습니다.", response);
    }

    // PATCH /api/matchings/{matchingId}/contract/cancel — 계약 취소 (당사자 둘 다)
    @Operation(summary = "계약 취소 (매칭 당사자 전용)",
            description = "둘 중 한 명만 취소해도 계약이 취소되며 되돌릴 수 없다.")
    @PatchMapping("/{matchingId}/contract/cancel")
    public ApiResponse<ContractResponse> cancelContract(@PathVariable Long matchingId,
                                                        @AuthenticationPrincipal Long userId) {
        ContractResponse response = matchingService.cancelContract(matchingId, userId);
        return ApiResponse.success("계약을 취소했습니다.", response);
    }
}
