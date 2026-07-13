package com.farmbroker.farmbroker.auth.controller;

import com.farmbroker.farmbroker.auth.dto.LoginRequest;
import com.farmbroker.farmbroker.auth.dto.LoginResponse;
import com.farmbroker.farmbroker.auth.dto.SignupRequest;
import com.farmbroker.farmbroker.auth.dto.SignupResponse;
import com.farmbroker.farmbroker.auth.service.AuthService;
import com.farmbroker.farmbroker.common.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

// 인증 관련 엔드포인트를 노출하는 컨트롤러.
// 얇게 유지: 요청을 받아 서비스에 위임하고, 결과를 ApiResponse로 감싸 반환하는 역할만 한다.
// 비즈니스 로직은 일절 포함하지 않는다.
@Tag(name = "인증", description = "회원가입 · 로그인 API (비로그인 접근)")
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    // POST /api/auth/signup
    @Operation(summary = "회원가입")
    @PostMapping("/signup")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<SignupResponse> signup(@RequestBody @Valid SignupRequest request) {
        SignupResponse response = authService.signup(request);
        return ApiResponse.success("회원가입이 완료되었습니다.", response);
    }

    // POST /api/auth/login
    @Operation(summary = "로그인", description = "응답으로 받은 JWT를 우측 상단 Authorize 버튼에 등록하면 인증 필요 API를 테스트할 수 있다.")
    @PostMapping("/login")
    public ApiResponse<LoginResponse> login(@RequestBody @Valid LoginRequest request) {
        LoginResponse response = authService.login(request);
        return ApiResponse.success("로그인에 성공했습니다.", response);
    }
}
