package com.farmbroker.farmbroker.auth.dto;

import com.farmbroker.farmbroker.user.domain.User;
import com.farmbroker.farmbroker.user.dto.UserResponse;
import lombok.Getter;

// 로그인 성공 응답의 data 필드 DTO.
// Access Token은 응답 본문이 아니라 httpOnly 쿠키(Set-Cookie)로 내려가므로 여기에는 담지 않는다.
// (JS에서 토큰을 읽지 못하게 해 XSS 토큰 탈취를 차단) — 본문에는 사용자 정보만 포함한다.
@Getter
public class LoginResponse {

    private final UserResponse user;

    private LoginResponse(UserResponse user) {
        this.user = user;
    }

    public static LoginResponse of(User user) {
        return new LoginResponse(UserResponse.from(user));
    }
}
