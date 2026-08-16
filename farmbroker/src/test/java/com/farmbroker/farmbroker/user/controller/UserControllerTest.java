package com.farmbroker.farmbroker.user.controller;

import com.farmbroker.farmbroker.security.AuthCookieProvider;
import com.farmbroker.farmbroker.security.JwtAuthenticationFilter;
import com.farmbroker.farmbroker.security.JwtTokenProvider;
import com.farmbroker.farmbroker.security.SecurityConfig;
import com.farmbroker.farmbroker.user.domain.User;
import com.farmbroker.farmbroker.user.dto.UserResponse;
import com.farmbroker.farmbroker.user.repository.UserRepository;
import com.farmbroker.farmbroker.user.service.UserService;
import org.junit.jupiter.api.BeforeEach;
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
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(UserController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, JwtTokenProvider.class, AuthCookieProvider.class})
@TestPropertySource(properties = {
        "jwt.secret=test-secret-key-for-user-controller-0123456789",
        "jwt.expiration=86400000"
})
class UserControllerTest {

    private static final long USER_ID = 1L;

    @Autowired private MockMvc mockMvc;
    @Autowired private JwtTokenProvider jwtTokenProvider;

    @MockitoBean private UserService userService;
    @MockitoBean private UserRepository userRepository;

    @BeforeEach
    void authenticateActiveUser() {
        given(userRepository.existsByIdAndWithdrawnAtIsNull(USER_ID)).willReturn(true);
    }

    @Test
    void patchMe_returns_updated_user() throws Exception {
        User user = User.builder().email("member@example.com").password("hashed").nickname("새 닉네임").build();
        given(userService.updateMe(any(), any())).willReturn(UserResponse.from(user));

        mockMvc.perform(patch("/users/me")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nickname\":\"새 닉네임\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.nickname").value("새 닉네임"));
    }

    @Test
    void patchMe_rejects_incomplete_password_change_before_service() throws Exception {
        mockMvc.perform(patch("/users/me")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nickname\":\"닉네임\",\"currentPassword\":\"current-password\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("VALIDATION_ERROR"));
    }

    @Test
    void deleteMe_clears_access_cookie_after_service_succeeds() throws Exception {
        mockMvc.perform(delete("/users/me")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"currentPassword\":\"current-password\",\"agreement\":true}"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.SET_COOKIE, containsString("Max-Age=0")));

        verify(userService).withdraw(any(), any());
    }

    private String bearerToken() {
        return "Bearer " + jwtTokenProvider.generateToken(USER_ID);
    }
}
