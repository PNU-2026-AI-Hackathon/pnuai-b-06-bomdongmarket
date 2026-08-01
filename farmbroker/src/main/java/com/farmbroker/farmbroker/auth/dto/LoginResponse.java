package com.farmbroker.farmbroker.auth.dto;

import com.farmbroker.farmbroker.user.domain.User;
import com.farmbroker.farmbroker.user.dto.UserResponse;
import lombok.Getter;

// 로그인 성공 응답의 data 필드 DTO.
// JWT accessToken과 유저 정보를 하나의 객체로 묶어 반환한다.
// 클라이언트는 accessToken을 로컬 스토리지 등에 저장하고,
// 이후 요청의 Authorization 헤더에 포함시킨다.
@Getter
public class LoginResponse {

    private final String accessToken;
    private final UserResponse user;

    private LoginResponse(String accessToken, UserResponse user) {
        this.accessToken = accessToken;
        this.user = user;
    }

    public static LoginResponse of(String accessToken, User user) {
        return new LoginResponse(accessToken, UserResponse.from(user));
    }
}
