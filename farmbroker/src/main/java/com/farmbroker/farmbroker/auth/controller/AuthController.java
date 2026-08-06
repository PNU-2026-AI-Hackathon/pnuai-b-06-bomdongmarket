package com.farmbroker.farmbroker.auth.controller;

import com.farmbroker.farmbroker.auth.dto.LoginRequest;
import com.farmbroker.farmbroker.auth.dto.LoginResponse;
import com.farmbroker.farmbroker.auth.dto.SignupRequest;
import com.farmbroker.farmbroker.auth.dto.SignupResponse;
import com.farmbroker.farmbroker.auth.service.AuthService;
import com.farmbroker.farmbroker.common.response.ApiResponse;
import com.farmbroker.farmbroker.security.AuthCookieProvider;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

// 인증 관련 엔드포인트를 노출하는 컨트롤러.
// 얇게 유지: 요청을 받아 서비스에 위임하고, 결과를 ApiResponse로 감싸 반환하는 역할만 한다.
// 비즈니스 로직은 일절 포함하지 않는다.
@Tag(name = "인증", description = "회원가입 · 로그인 · 로그아웃 API")
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final AuthCookieProvider authCookieProvider;

    // POST /api/auth/signup
    @Operation(summary = "회원가입")
    @PostMapping("/signup")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<SignupResponse> signup(@RequestBody @Valid SignupRequest request) {
        SignupResponse response = authService.signup(request);
        return ApiResponse.success("회원가입이 완료되었습니다.", response);
    }

    // POST /api/auth/login
    // Access Token은 응답 본문이 아니라 httpOnly 쿠키(Set-Cookie)로 내려간다.
    // Swagger는 API와 동일 출처(localhost:8080)라 로그인 후 쿠키가 자동 포함되어 인증 API 테스트가 가능하다.
    @Operation(summary = "로그인", description = "성공 시 Access Token을 httpOnly 쿠키로 발급한다. Swagger는 동일 출처라 로그인 후 인증 필요 API를 바로 테스트할 수 있다.")
    @PostMapping("/login")
    public ApiResponse<LoginResponse> login(@RequestBody @Valid LoginRequest request,
                                            HttpServletResponse response) {
        AuthService.LoginResult result = authService.login(request);
        response.addHeader(HttpHeaders.SET_COOKIE,
                authCookieProvider.createAccessTokenCookie(result.accessToken()).toString());
        return ApiResponse.success("로그인에 성공했습니다.", result.body());
    }

    // POST /api/auth/logout — 인증 필요 (SecurityConfig의 anyRequest().authenticated()로 보호)
    // 인증을 확인한 뒤 만료 쿠키(Max-Age=0)를 내려 브라우저의 인증 쿠키를 즉시 제거한다.
    @Operation(summary = "로그아웃", description = "인증된 사용자의 로그아웃 요청. Access Token 쿠키를 만료(Max-Age=0)시켜 제거한다.")
    @PostMapping("/logout")
    public ApiResponse<Void> logout(@AuthenticationPrincipal Long userId,
                                    HttpServletResponse response) {
        authService.logout(userId);
        response.addHeader(HttpHeaders.SET_COOKIE, authCookieProvider.createExpiredCookie().toString());
        return ApiResponse.success("로그아웃되었습니다.", null);
    }
}
