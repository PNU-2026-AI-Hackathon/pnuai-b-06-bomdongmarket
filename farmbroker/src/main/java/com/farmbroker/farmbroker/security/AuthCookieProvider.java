package com.farmbroker.farmbroker.security;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import java.time.Duration;

// Access Token을 담는 httpOnly 쿠키의 발급 · 삭제 · 추출을 전담하는 컴포넌트.
// 서블릿 응답에 직접 접근하지 않고 ResponseCookie만 만들어 반환한다 — 헤더에 싣는 일은 컨트롤러가 한다.
// 쿠키 속성(secure/sameSite)은 application.yml에서 주입받아 dev(http)/prod(https)를 env로 토글한다.
//
// CSRF 방어: same-site 배포 + SameSite=Lax 조합으로 cross-site 요청에서는 쿠키가 실리지 않아 막힌다.
// (별도 CSRF 토큰은 두지 않는다 — cross-site 배포로 전환 시 SameSite=None;Secure + 토큰 도입 필요)
@Component
public class AuthCookieProvider {

    private final String cookieName;
    private final boolean secure;
    private final String sameSite;
    private final long maxAgeSeconds;

    public AuthCookieProvider(
            @Value("${jwt.cookie.name:accessToken}") String cookieName,
            @Value("${jwt.cookie.secure:false}") boolean secure,
            @Value("${jwt.cookie.same-site:Lax}") String sameSite,
            @Value("${jwt.expiration}") long expirationMs
    ) {
        this.cookieName = cookieName;
        this.secure = secure;
        this.sameSite = sameSite;
        // 쿠키 maxAge는 토큰 만료(ms)와 동일하게 맞춘다 → 초 단위로 환산
        this.maxAgeSeconds = expirationMs / 1000;
    }

    public String cookieName() {
        return cookieName;
    }

    // 로그인 성공 시 발급하는 인증 쿠키
    public ResponseCookie createAccessTokenCookie(String token) {
        return baseCookie(token, Duration.ofSeconds(maxAgeSeconds));
    }

    // 로그아웃 시 즉시 만료시키는 쿠키 (maxAge=0)
    public ResponseCookie createExpiredCookie() {
        return baseCookie("", Duration.ZERO);
    }

    private ResponseCookie baseCookie(String value, Duration maxAge) {
        return ResponseCookie.from(cookieName, value)
                .httpOnly(true)
                .secure(secure)
                .sameSite(sameSite)
                .path("/")
                .maxAge(maxAge)
                .build();
    }

    // 요청 쿠키에서 Access Token 값을 추출. 없으면 null.
    public String resolveToken(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return null;
        }
        for (Cookie cookie : cookies) {
            if (cookieName.equals(cookie.getName())) {
                return cookie.getValue();
            }
        }
        return null;
    }
}
