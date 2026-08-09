package com.farmbroker.farmbroker.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import com.farmbroker.farmbroker.user.repository.UserRepository;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

// 모든 요청마다 한 번씩 실행되는 JWT 인증 필터.
// httpOnly 쿠키(우선) 또는 Authorization 헤더(폴백)에서 토큰을 추출해 유효성을 검사하고,
// 유효하면 userId를 principal로 하는 인증 객체를 SecurityContext에 저장한다.
// 토큰이 없거나 유효하지 않으면 SecurityContext를 건드리지 않아
// 이후 SecurityConfig의 접근 제어 설정이 자연스럽게 401을 처리하게 한다.
//
// 웹 프론트는 쿠키만 사용하지만, curl · Swagger 등 도구 테스트 편의를 위해 헤더 폴백을 유지한다.
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;
    private final AuthCookieProvider authCookieProvider;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String token = resolveToken(request);

        if (token != null && jwtTokenProvider.validateToken(token)) {
            Long userId = jwtTokenProvider.getUserId(token);
            if (userRepository.existsByIdAndWithdrawnAtIsNull(userId)) {
                // principal에 userId(Long)를 저장 — 컨트롤러에서 @AuthenticationPrincipal Long userId로 꺼낸다
                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(userId, null, Collections.emptyList());
                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        }

        filterChain.doFilter(request, response);
    }

    // 토큰 추출 — httpOnly 쿠키를 먼저 확인하고, 없으면 "Bearer {token}" 헤더에서 추출한다.
    private String resolveToken(HttpServletRequest request) {
        String cookieToken = authCookieProvider.resolveToken(request);
        if (StringUtils.hasText(cookieToken)) {
            return cookieToken;
        }
        String bearer = request.getHeader("Authorization");
        if (StringUtils.hasText(bearer) && bearer.startsWith("Bearer ")) {
            return bearer.substring(7);
        }
        return null;
    }
}
