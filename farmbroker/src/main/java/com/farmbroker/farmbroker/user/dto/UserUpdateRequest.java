package com.farmbroker.farmbroker.user.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class UserUpdateRequest {

    @NotBlank(message = "닉네임은 필수입니다.")
    @Size(min = 2, max = 30, message = "닉네임은 2자 이상 30자 이하이어야 합니다.")
    private String nickname;

    private String currentPassword;

    @Size(min = 8, message = "비밀번호는 8자 이상이어야 합니다.")
    private String newPassword;

    public boolean changesPassword() {
        return newPassword != null && !newPassword.isBlank();
    }

    @AssertTrue(message = "비밀번호 변경 시 현재 비밀번호와 새 비밀번호를 함께 입력해야 합니다.")
    public boolean isPasswordChangeComplete() {
        boolean hasCurrentPassword = currentPassword != null && !currentPassword.isBlank();
        boolean hasNewPassword = newPassword != null && !newPassword.isBlank();
        return hasCurrentPassword == hasNewPassword;
    }
}
