package com.farmbroker.farmbroker.user.dto;

import com.farmbroker.farmbroker.user.domain.User;
import com.farmbroker.farmbroker.user.domain.UserRole;
import lombok.Getter;

// 회원 정보를 외부에 노출하는 공용 DTO.
// 로그인 응답의 user 필드와 GET /users/me 응답 data 필드 양쪽에서 재사용한다.
// 엔티티 PK(id)를 userId로 매핑하고, password는 포함하지 않아 민감정보 노출을 차단한다.
@Getter
public class UserResponse {

    private final Long userId;
    private final String email;
    private final String nickname;
    private final UserRole role;

    private UserResponse(Long userId, String email, String nickname, UserRole role) {
        this.userId = userId;
        this.email = email;
        this.nickname = nickname;
        this.role = role;
    }

    public static UserResponse from(User user) {
        return new UserResponse(user.getId(), user.getEmail(), user.getNickname(), user.getRole());
    }
}
