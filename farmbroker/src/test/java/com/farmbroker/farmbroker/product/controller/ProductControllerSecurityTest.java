package com.farmbroker.farmbroker.product.controller;

import com.farmbroker.farmbroker.product.service.ProductService;
import com.farmbroker.farmbroker.security.AuthCookieProvider;
import com.farmbroker.farmbroker.security.JwtAuthenticationFilter;
import com.farmbroker.farmbroker.security.JwtTokenProvider;
import com.farmbroker.farmbroker.security.SecurityConfig;
import com.farmbroker.farmbroker.user.repository.UserRepository;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// 로컬마켓 엔드포인트의 접근 제어 계약을 검증한다.
//   - 목록/상세: 비로그인 허용
//   - 등록/내 판매 상품: 로그인 필요(쿠키 또는 헤더)
// 실제 SecurityConfig + JWT 필터를 로드해 접근 제어 흐름을 그대로 태운다. ProductService는 목으로 대체.
@WebMvcTest(ProductController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, JwtTokenProvider.class, AuthCookieProvider.class})
@TestPropertySource(properties = {
        "jwt.secret=test-secret-key-for-product-security-0123456789",
        "jwt.expiration=86400000"
})
class ProductControllerSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @MockitoBean
    private ProductService productService;

    @MockitoBean
    private UserRepository userRepository;

    @Test
    @DisplayName("상품 목록은 비로그인으로 조회할 수 있다")
    void listIsPublic() throws Exception {
        given(productService.getList(any(), any())).willReturn(List.of());

        mockMvc.perform(get("/products"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("상품 상세는 비로그인으로 조회할 수 있다")
    void detailIsPublic() throws Exception {
        given(productService.getDetail(1L)).willReturn(null);

        mockMvc.perform(get("/products/1"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("로그인 없이 상품을 등록하면 401")
    void createRequiresAuth() throws Exception {
        mockMvc.perform(post("/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "버터헤드 상추",
                                  "category": "잎채소",
                                  "price": 4300,
                                  "unit": "팩",
                                  "stock": 24,
                                  "harvestDate": "2026-07-05",
                                  "productionLocation": "장전 스마트팜"
                                }
                                """))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("로그인 없이 내 판매 상품을 조회하면 401")
    void myRequiresAuth() throws Exception {
        mockMvc.perform(get("/products/my"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("인증 쿠키가 있으면 상품을 등록할 수 있다(201)")
    void createWithCookieSucceeds() throws Exception {
        given(productService.create(any(), any())).willReturn(null);
        given(userRepository.existsByIdAndWithdrawnAtIsNull(1L)).willReturn(true);
        String token = jwtTokenProvider.generateToken(1L);

        mockMvc.perform(post("/products")
                        .cookie(new Cookie("accessToken", token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "버터헤드 상추",
                                  "category": "잎채소",
                                  "price": 4300,
                                  "unit": "팩",
                                  "stock": 24,
                                  "harvestDate": "2026-07-05",
                                  "productionLocation": "장전 스마트팜"
                                }
                                """))
                .andExpect(status().isCreated());
    }
}
