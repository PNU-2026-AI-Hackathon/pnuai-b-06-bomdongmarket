package com.farmbroker.farmbroker.security;

import com.farmbroker.farmbroker.user.domain.UserRole;
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
// subject에 userId, claim에 role을 담아 발급하고,
// 필터에서 토큰을 받으면 userId를 꺼내 SecurityContext에 인증 정보를 세팅한다.
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

    // 토큰 생성 — subject: userId(String), claim: role
    public String generateToken(Long userId, UserRole role) {
        Date now = new Date();
        return Jwts.builder()
                .subject(String.valueOf(userId))
                .claim("role", role.name())
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
