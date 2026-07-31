package com.farmbroker.farmbroker.auth.controller;

import com.farmbroker.farmbroker.auth.service.AuthService;
import com.farmbroker.farmbroker.security.JwtAuthenticationFilter;
import com.farmbroker.farmbroker.security.JwtTokenProvider;
import com.farmbroker.farmbroker.security.SecurityConfig;
import com.farmbroker.farmbroker.user.domain.UserRole;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// POST /auth/logout 의 인증 계약(security contract)을 검증하는 슬라이스 테스트.
//
// 리뷰(@03leedo) 요청 사항:
//   1. 유효한 JWT 요청은 200을 반환한다.
//   2. 토큰이 없거나 유효하지 않은 요청은 401을 반환한다.
//
// no-op 서비스 로직이 아니라 "Spring Security + JWT 필터가 엔드포인트를 의도대로 보호하는가"를 확인하는 것이
// 이 테스트의 핵심이다. 그래서 AuthService 는 목(mock)으로 대체하되,
// JwtAuthenticationFilter · JwtTokenProvider · SecurityConfig 는 실제 빈을 그대로 로드해
// 실제 토큰 검증 → 접근 제어 흐름을 그대로 태운다. (DB/JPA 는 로드하지 않아 MySQL 없이 동작한다.)
@WebMvcTest(AuthController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, JwtTokenProvider.class})
@TestPropertySource(properties = {
        "jwt.secret=test-secret-key-for-logout-contract-0123456789",
        "jwt.expiration=86400000"
})
class AuthControllerLogoutTest {

    @Autowired
    private MockMvc mockMvc;

    // 실제 발급 로직으로 유효한 토큰을 만들기 위해 실제 빈을 주입받는다.
    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    // 인증 계약만 검증하면 되므로 서비스는 목으로 대체 (logout 은 no-op).
    @MockitoBean
    private AuthService authService;

    @Test
    @DisplayName("유효한 JWT로 로그아웃을 요청하면 200을 반환한다")
    void logout_withValidToken_returns200() throws Exception {
        String token = jwtTokenProvider.generateToken(1L, UserRole.OWNER);

        mockMvc.perform(post("/auth/logout")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("토큰 없이 로그아웃을 요청하면 401을 반환한다")
    void logout_withoutToken_returns401() throws Exception {
        mockMvc.perform(post("/auth/logout"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("유효하지 않은 토큰으로 로그아웃을 요청하면 401을 반환한다")
    void logout_withInvalidToken_returns401() throws Exception {
        mockMvc.perform(post("/auth/logout")
                        .header("Authorization", "Bearer invalid.jwt.token"))
                .andExpect(status().isUnauthorized());
    }
}
