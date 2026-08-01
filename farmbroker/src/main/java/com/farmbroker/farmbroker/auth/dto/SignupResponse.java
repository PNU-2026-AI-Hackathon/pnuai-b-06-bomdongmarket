package com.farmbroker.farmbroker.auth.dto;

import com.farmbroker.farmbroker.user.domain.User;
import com.farmbroker.farmbroker.user.domain.UserRole;
import lombok.Getter;

// 회원가입 성공 응답의 data 필드에 들어가는 DTO.
// User 엔티티를 직접 반환하지 않고 이 DTO로 변환함으로써
// password 같은 민감 필드가 응답에 노출되는 것을 구조적으로 차단한다.
// 엔티티 PK(id)를 userId로 노출하는 것도 여기서 처리한다.
@Getter
public class SignupResponse {

    private final Long userId;
    private final String email;
    private final String nickname;
    private final UserRole role;

    private SignupResponse(Long userId, String email, String nickname, UserRole role) {
        this.userId = userId;
        this.email = email;
        this.nickname = nickname;
        this.role = role;
    }

    public static SignupResponse from(User user) {
        return new SignupResponse(user.getId(), user.getEmail(), user.getNickname(), user.getRole());
    }
}
