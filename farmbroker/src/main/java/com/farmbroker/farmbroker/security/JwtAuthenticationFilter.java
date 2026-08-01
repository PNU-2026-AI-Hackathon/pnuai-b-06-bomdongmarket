package com.farmbroker.farmbroker.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

// 모든 요청마다 한 번씩 실행되는 JWT 인증 필터.
// Authorization 헤더에서 Bearer 토큰을 추출해 유효성을 검사하고,
// 유효하면 userId를 principal로 하는 인증 객체를 SecurityContext에 저장한다.
// 토큰이 없거나 유효하지 않으면 SecurityContext를 건드리지 않아
// 이후 SecurityConfig의 접근 제어 설정이 자연스럽게 401을 처리하게 한다.
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String token = resolveToken(request);

        if (token != null && jwtTokenProvider.validateToken(token)) {
            Long userId = jwtTokenProvider.getUserId(token);
            // principal에 userId(Long)를 저장 — 컨트롤러에서 @AuthenticationPrincipal Long userId로 꺼낸다
            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(userId, null, Collections.emptyList());
            SecurityContextHolder.getContext().setAuthentication(authentication);
        }

        filterChain.doFilter(request, response);
    }

    // "Bearer {token}" 형식에서 토큰 부분만 추출. 헤더 없거나 형식 다르면 null 반환
    private String resolveToken(HttpServletRequest request) {
        String bearer = request.getHeader("Authorization");
        if (StringUtils.hasText(bearer) && bearer.startsWith("Bearer ")) {
            return bearer.substring(7);
        }
        return null;
    }
}
