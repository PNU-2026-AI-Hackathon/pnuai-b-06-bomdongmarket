package com.farmbroker.farmbroker.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import jakarta.servlet.http.HttpServletResponse;
import java.util.List;

// Spring Security 6.x 방식의 보안 설정.
// SecurityFilterChain Bean으로 구성하며, WebSecurityConfigurerAdapter는 사용하지 않는다.
// JWT 기반 Stateless 인증이므로 CSRF · 세션을 비활성화하고,
// JwtAuthenticationFilter를 UsernamePasswordAuthenticationFilter 앞에 삽입한다.
// CORS도 여기서 함께 관리해 웹 프론트(React)와의 연동을 보장한다.
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    // 401 응답 JSON 상수 — ObjectMapper 의존 없이 직접 작성
    private static final String UNAUTHORIZED_BODY =
            "{\"success\":false,\"message\":\"인증이 필요합니다.\",\"errorCode\":\"UNAUTHORIZED\"}";

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // 인증 불필요 — 회원가입 · 로그인
                .requestMatchers(HttpMethod.POST, "/auth/signup", "/auth/login").permitAll()
                // 인증 불필요 — 작물 백과사전 공개 조회 (백엔드 3, 2026-07-05 협의로 백엔드 3이 직접 추가)
                .requestMatchers(HttpMethod.GET, "/crops", "/crops/**").permitAll()
                // 내 공간 조회는 인증 유지 — 아래 /spaces/* 와일드카드가 /spaces/my까지 열지 않도록 반드시 먼저 선언
                .requestMatchers(HttpMethod.GET, "/spaces/my").authenticated()
                // 인증 불필요 — 공간 목록/상세는 비로그인 조회 허용 (space 도메인 명세 2.2/2.3)
                .requestMatchers(HttpMethod.GET, "/spaces", "/spaces/*").permitAll()
                // swagger 경로 설정
                .requestMatchers(HttpMethod.GET, "/swagger-ui/**", "/v3/api-docs/**", "/swagger-ui.html").permitAll()
                // 그 외 모든 요청은 인증 필요 (다른 팀원 도메인 API도 자동 보호됨)
                .anyRequest().authenticated()
            )
            .exceptionHandling(ex -> ex
                // 인증 없이 보호 자원에 접근 시 redirect 대신 401 JSON 반환
                .authenticationEntryPoint((request, response, authException) -> {
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.setContentType(MediaType.APPLICATION_JSON_VALUE + ";charset=UTF-8");
                    response.getWriter().write(UNAUTHORIZED_BODY);
                })
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    // CORS 설정 — 웹 프론트(Vite: 5173, CRA: 3000) 양쪽 허용
    // allowCredentials(true)이므로 Origin에 * 사용 불가 → 명시적 Origin 지정
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("http://localhost:5173", "http://localhost:3000"));
        config.setAllowedMethods(List.of("GET", "POST", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
