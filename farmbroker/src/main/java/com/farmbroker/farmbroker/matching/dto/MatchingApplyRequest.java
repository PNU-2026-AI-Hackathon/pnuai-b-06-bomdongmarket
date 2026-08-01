package com.farmbroker.farmbroker.matching.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

// 매칭 신청(POST /matchings) 요청 바디 DTO.
@Getter
@NoArgsConstructor
public class MatchingApplyRequest {

    @NotNull(message = "공간 ID는 필수입니다.")
    private Long spaceId;

    @NotBlank(message = "신청 메시지는 필수입니다.")
    @Size(max = 500, message = "신청 메시지는 500자 이하여야 합니다.")
    private String message;
}
