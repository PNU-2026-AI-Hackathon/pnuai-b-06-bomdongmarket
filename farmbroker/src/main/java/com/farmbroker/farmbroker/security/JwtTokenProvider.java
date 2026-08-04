package com.farmbroker.farmbroker.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

// JWT 토큰의 생성 · 파싱 · 검증을 전담하는 컴포넌트.
// subject에 userId만 담아 발급하고, 필터에서 토큰을 받으면 userId를 꺼내
// SecurityContext에 인증 정보를 세팅한다.
// role은 claim에 넣지 않는다 — 역할이 활동에 따라 늘어나는 가변 값이라
// 토큰에 박아두면 발급 직후부터 실제 값과 어긋난다. 권한 판단은 매번 DB의 User를 읽어서 한다.
// secret과 expiration은 application.yml에서 주입받아 하드코딩을 방지한다.
@Component
public class JwtTokenProvider {

    private final SecretKey signingKey;
    private final long expiration;

    public JwtTokenProvider(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.expiration}") long expiration
    ) {
        // jjwt 0.12.x: Keys.hmacShaKeyFor()로 SecretKey 생성
        this.signingKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expiration = expiration;
    }

    // 토큰 생성 — subject: userId(String)
    public String generateToken(Long userId) {
        Date now = new Date();
        return Jwts.builder()
                .subject(String.valueOf(userId))
                .issuedAt(now)
                .expiration(new Date(now.getTime() + expiration))
                .signWith(signingKey)
                .compact();
    }

    // 토큰에서 userId 추출
    public Long getUserId(String token) {
        return Long.parseLong(getClaims(token).getSubject());
    }

    // 토큰 유효성 검증 — 만료 · 위변조 · 형식 오류 모두 false 반환
    public boolean validateToken(String token) {
        try {
            getClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    private Claims getClaims(String token) {
        // jjwt 0.12.x 신 API: parser().verifyWith(key).build().parseSignedClaims()
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
