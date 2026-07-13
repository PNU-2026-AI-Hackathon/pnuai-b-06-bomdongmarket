package com.farmbroker.farmbroker.user.controller;

import com.farmbroker.farmbroker.common.response.ApiResponse;
import com.farmbroker.farmbroker.user.dto.UserResponse;
import com.farmbroker.farmbroker.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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

    // GET /api/users/me
    @Operation(summary = "내 정보 조회")
    @GetMapping("/me")
    public ApiResponse<UserResponse> getMe(@AuthenticationPrincipal Long userId) {
        UserResponse response = userService.getMe(userId);
        return ApiResponse.success("내 정보 조회에 성공했습니다.", response);
    }
}
