package com.farmbroker.farmbroker.user.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class UserWithdrawalRequest {

    @NotBlank(message = "현재 비밀번호는 필수입니다.")
    private String currentPassword;

    @AssertTrue(message = "회원 탈퇴에 동의해야 합니다.")
    private boolean agreement;
}
