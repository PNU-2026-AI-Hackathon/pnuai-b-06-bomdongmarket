package com.farmbroker.farmbroker.auth.controller;

import com.farmbroker.farmbroker.auth.dto.LoginResponse;
import com.farmbroker.farmbroker.auth.service.AuthService;
import com.farmbroker.farmbroker.security.AuthCookieProvider;
import com.farmbroker.farmbroker.security.JwtAuthenticationFilter;
import com.farmbroker.farmbroker.security.JwtTokenProvider;
import com.farmbroker.farmbroker.security.SecurityConfig;
import com.farmbroker.farmbroker.user.domain.User;
import com.farmbroker.farmbroker.user.repository.UserRepository;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// JWT를 httpOnly 쿠키로 발급/검증하는 계약을 검증하는 슬라이스 테스트.
//   1. 로그인 성공 시 httpOnly · SameSite=Lax 쿠키를 발급하고, 응답 본문에는 토큰을 넣지 않는다.
//   2. Authorization 헤더 없이 쿠키만으로도 인증 필요 API가 통과한다.
//   3. 로그아웃 시 만료 쿠키(Max-Age=0)를 내려 브라우저 쿠키를 제거한다.
//
// AuthService는 목으로 대체하되, JwtAuthenticationFilter · JwtTokenProvider · AuthCookieProvider · SecurityConfig는
// 실제 빈을 로드해 "쿠키 → 토큰 검증 → 접근 제어" 흐름을 그대로 태운다.
@WebMvcTest(AuthController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, JwtTokenProvider.class, AuthCookieProvider.class})
@TestPropertySource(properties = {
        "jwt.secret=test-secret-key-for-cookie-contract-0123456789",
        "jwt.expiration=86400000"
})
class AuthCookieContractTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @MockitoBean
    private AuthService authService;

    @MockitoBean
    private UserRepository userRepository;

    @BeforeEach
    void allowActiveUserTokens() {
        given(userRepository.existsByIdAndWithdrawnAtIsNull(1L)).willReturn(true);
    }

    @Test
    @DisplayName("로그인 성공 시 httpOnly Access Token 쿠키를 발급하고, 본문에는 토큰을 넣지 않는다")
    void login_issuesHttpOnlyCookie_andBodyHasNoToken() throws Exception {
        User user = User.builder()
                .email("owner@example.com")
                .password("hashed")
                .nickname("공간제공자1")
                .build();
        given(authService.login(any()))
                .willReturn(new AuthService.LoginResult("jwt-token-value", LoginResponse.of(user)));

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"owner@example.com\",\"password\":\"12345678\"}"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.SET_COOKIE, containsString("accessToken=jwt-token-value")))
                .andExpect(header().string(HttpHeaders.SET_COOKIE, containsString("HttpOnly")))
                .andExpect(header().string(HttpHeaders.SET_COOKIE, containsString("SameSite=Lax")))
                .andExpect(jsonPath("$.data.accessToken").doesNotExist())
                .andExpect(jsonPath("$.data.user.email").value("owner@example.com"));
    }

    @Test
    @DisplayName("Authorization 헤더 없이 쿠키만으로도 인증 필요 API가 통과한다")
    void cookieAlone_authenticatesProtectedEndpoint() throws Exception {
        String token = jwtTokenProvider.generateToken(1L);

        mockMvc.perform(post("/auth/logout")
                        .cookie(new Cookie("accessToken", token)))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("탈퇴한 사용자의 기존 인증 쿠키는 보호 API에서 401로 차단된다")
    void withdrawnUserCookie_isRejected() throws Exception {
        String token = jwtTokenProvider.generateToken(1L);
        given(userRepository.existsByIdAndWithdrawnAtIsNull(1L)).willReturn(false);

        mockMvc.perform(post("/auth/logout")
                        .cookie(new Cookie("accessToken", token)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("로그아웃 시 만료 쿠키(Max-Age=0)를 내려 인증 쿠키를 제거한다")
    void logout_clearsCookie() throws Exception {
        String token = jwtTokenProvider.generateToken(1L);

        mockMvc.perform(post("/auth/logout")
                        .cookie(new Cookie("accessToken", token)))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.SET_COOKIE, containsString("Max-Age=0")));
    }
}
