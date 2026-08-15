package com.farmbroker.farmbroker.user.controller;

import com.farmbroker.farmbroker.common.response.ApiResponse;
import com.farmbroker.farmbroker.security.AuthCookieProvider;
import com.farmbroker.farmbroker.user.dto.UserUpdateRequest;
import com.farmbroker.farmbroker.user.dto.UserResponse;
import com.farmbroker.farmbroker.user.dto.UserWithdrawalRequest;
import com.farmbroker.farmbroker.user.dto.WithdrawalEligibilityResponse;
import com.farmbroker.farmbroker.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

// 유저 관련 엔드포인트 컨트롤러.
// JwtAuthenticationFilter가 SecurityContext에 저장한 userId(Long)를
// @AuthenticationPrincipal로 바로 주입받아 서비스에 전달한다.
// SecurityConfig에서 이 경로를 authenticated()로 지정했으므로
// 유효한 JWT 없이 접근하면 필터 단에서 401로 차단된다.
@Tag(name = "유저", description = "유저 정보 API (인증 필요)")
@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final AuthCookieProvider authCookieProvider;

    // GET /api/users/me
    @Operation(summary = "내 정보 조회")
    @GetMapping("/me")
    public ApiResponse<UserResponse> getMe(@AuthenticationPrincipal Long userId) {
        UserResponse response = userService.getMe(userId);
        return ApiResponse.success("내 정보 조회에 성공했습니다.", response);
    }

    @Operation(summary = "내 정보 수정")
    @PatchMapping("/me")
    public ApiResponse<UserResponse> updateMe(@AuthenticationPrincipal Long userId,
                                              @RequestBody @Valid UserUpdateRequest request) {
        return ApiResponse.success("내 정보가 수정되었습니다.", userService.updateMe(userId, request));
    }

    @Operation(summary = "회원 탈퇴 가능 여부 확인")
    @GetMapping("/me/withdrawal-eligibility")
    public ApiResponse<WithdrawalEligibilityResponse> getWithdrawalEligibility(@AuthenticationPrincipal Long userId) {
        return ApiResponse.success("회원 탈퇴 가능 여부를 확인했습니다.",
                userService.getWithdrawalEligibility(userId));
    }

    @Operation(summary = "회원 탈퇴")
    @DeleteMapping("/me")
    public ApiResponse<Void> withdraw(@AuthenticationPrincipal Long userId,
                                      @RequestBody @Valid UserWithdrawalRequest request,
                                      HttpServletResponse response) {
        userService.withdraw(userId, request);
        response.addHeader(HttpHeaders.SET_COOKIE, authCookieProvider.createExpiredCookie().toString());
        return ApiResponse.success("회원 탈퇴가 완료되었습니다.", null);
    }
}
