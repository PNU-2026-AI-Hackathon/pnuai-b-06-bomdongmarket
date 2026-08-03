package com.farmbroker.farmbroker.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

// 회원가입 요청 바디를 바인딩하는 DTO.
// jakarta.validation 어노테이션으로 컨트롤러 진입 전에 입력값을 검증해
// 서비스 레이어까지 잘못된 값이 내려가지 않도록 막는다.
//
// 역할(role)은 더 이상 받지 않는다 — 클라이언트가 자칭하는 값이라 검증이 불가능했고,
// 이제는 가입 시 CONSUMER로 시작해 활동에 따라 서버가 부여한다.
// 구버전 클라이언트가 role을 보내도 매핑되는 필드가 없어 무시된다.
@Getter
@NoArgsConstructor
public class SignupRequest {

    @NotBlank(message = "이메일은 필수입니다.")
    @Email(message = "이메일 형식이 올바르지 않습니다.")
    private String email;

    @NotBlank(message = "비밀번호는 필수입니다.")
    @Size(min = 8, message = "비밀번호는 8자 이상이어야 합니다.")
    private String password;

    @NotBlank(message = "닉네임은 필수입니다.")
    @Size(min = 2, max = 30, message = "닉네임은 2자 이상 30자 이하이어야 합니다.")
    private String nickname;
}
