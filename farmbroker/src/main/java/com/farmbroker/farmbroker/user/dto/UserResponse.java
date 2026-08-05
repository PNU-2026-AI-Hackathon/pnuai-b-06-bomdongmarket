package com.farmbroker.farmbroker.user.dto;

import com.farmbroker.farmbroker.user.domain.User;
import com.farmbroker.farmbroker.user.domain.UserRole;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;

import java.util.List;

// 회원 정보를 외부에 노출하는 공용 DTO.
// 로그인 응답의 user 필드와 GET /users/me 응답 data 필드 양쪽에서 재사용한다.
// 엔티티 PK(id)를 userId로 매핑하고, password는 포함하지 않아 민감정보 노출을 차단한다.
@Getter
public class UserResponse {

    private final Long userId;
    private final String email;
    private final String nickname;

    @Schema(description = "보유 역할 목록 — 활동에 따라 누적된다(가입 시 CONSUMER, 공간 등록 시 OWNER, 매칭 수락 시 FARMER)",
            example = "[\"OWNER\", \"CONSUMER\"]")
    private final List<UserRole> roles;

    private UserResponse(Long userId, String email, String nickname, List<UserRole> roles) {
        this.userId = userId;
        this.email = email;
        this.nickname = nickname;
        this.roles = roles;
    }

    public static UserResponse from(User user) {
        return new UserResponse(user.getId(), user.getEmail(), user.getNickname(),
                List.copyOf(user.getRoles()));
    }
}
