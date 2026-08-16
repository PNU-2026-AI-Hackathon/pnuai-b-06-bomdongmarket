package com.farmbroker.farmbroker.matching.dto;

import com.farmbroker.farmbroker.matching.domain.MaintenanceFeePayer;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

// 계약 조건 저장(PATCH /matchings/{id}/contract) 요청 바디 DTO — 공간 소유자만 보낸다.
// 부분 수정이 아니라 모든 값을 한 번에 덮어쓴다: 조건 일부만 바뀐 계약서는 존재할 이유가 없고,
// 저장할 때마다 양측 동의가 초기화되므로 어차피 전부 확정한 뒤 저장해야 한다.
// 금액은 Integer라 소수점이 들어오면 Jackson이 400으로 거른다 — 검증은 하한만 두면 된다.
@Getter
@NoArgsConstructor
public class ContractTermsRequest {

    @NotNull(message = "월세는 필수입니다.")
    @Min(value = 1, message = "월세는 1원 이상이어야 합니다.")
    private Integer monthlyRent;

    @NotNull(message = "관리비는 필수입니다.")
    @Min(value = 1, message = "관리비는 1원 이상이어야 합니다.")
    private Integer maintenanceFee;

    @NotNull(message = "관리비 책임소재는 필수입니다.")
    private MaintenanceFeePayer maintenanceFeePayer;

    @NotNull(message = "보증금은 필수입니다.")
    @Min(value = 1, message = "보증금은 1원 이상이어야 합니다.")
    private Integer deposit;

    @NotNull(message = "계약 시작일은 필수입니다.")
    private LocalDate startDate;

    @NotNull(message = "계약 종료일은 필수입니다.")
    private LocalDate endDate;
}
