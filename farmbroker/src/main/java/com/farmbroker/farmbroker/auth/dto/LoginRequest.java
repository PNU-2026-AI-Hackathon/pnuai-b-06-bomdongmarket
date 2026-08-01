package com.farmbroker.farmbroker.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;

// 로그인 요청 바디 DTO.
// 이메일/비밀번호 형식이 잘못됐을 때 서비스 레이어까지 내려가지 않도록
// @Valid로 컨트롤러 진입 시점에 차단한다.
@Getter
@NoArgsConstructor
public class LoginRequest {

    @NotBlank(message = "이메일은 필수입니다.")
    @Email(message = "이메일 형식이 올바르지 않습니다.")
    private String email;

    @NotBlank(message = "비밀번호는 필수입니다.")
    private String password;
}
