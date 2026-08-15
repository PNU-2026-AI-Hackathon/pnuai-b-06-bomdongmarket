package com.farmbroker.farmbroker.matching.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

// 계약 조건 저장(PATCH /matchings/{id}/contract) 요청 바디 DTO — 공간 소유자만 보낸다.
// 부분 수정이 아니라 세 값을 한 번에 덮어쓴다: 조건 일부만 바뀐 계약서는 존재할 이유가 없고,
// 저장할 때마다 양측 동의가 초기화되므로 어차피 셋을 모두 확정한 뒤 저장해야 한다.
@Getter
@NoArgsConstructor
public class ContractTermsRequest {

    @NotNull(message = "월세는 필수입니다.")
    @Min(value = 0, message = "월세는 0원 이상이어야 합니다.")
    private Integer monthlyRent;

    @NotNull(message = "계약 시작일은 필수입니다.")
    private LocalDate startDate;

    @NotNull(message = "계약 종료일은 필수입니다.")
    private LocalDate endDate;
}
