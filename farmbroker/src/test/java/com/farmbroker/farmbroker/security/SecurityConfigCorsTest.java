package com.farmbroker.farmbroker.security;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

class SecurityConfigCorsTest {

    @Test
    void usesConfiguredFrontendOrigins() {
        SecurityConfig securityConfig = new SecurityConfig(
                mock(JwtAuthenticationFilter.class),
                "https://farmbroker.vercel.app, https://www.farmbroker.example");
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/products");

        var cors = securityConfig.corsConfigurationSource().getCorsConfiguration(request);

        assertThat(cors).isNotNull();
        assertThat(cors.getAllowedOrigins())
                .containsExactly("https://farmbroker.vercel.app", "https://www.farmbroker.example");
        assertThat(cors.getAllowCredentials()).isTrue();
    }
}
