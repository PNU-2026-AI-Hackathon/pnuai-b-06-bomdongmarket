package com.farmbroker.farmbroker.product.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

// 생산 이력 이벤트 요청 항목. 상품 등록/수정 시 events 배열로 함께 전달한다.
@Getter
@NoArgsConstructor
public class TraceabilityEventRequest {

    @NotBlank(message = "이력 단계명은 필수입니다.")
    @Size(max = 40, message = "이력 단계명은 40자 이하여야 합니다.")
    private String stage;

    @Size(max = 255, message = "이력 설명은 255자 이하여야 합니다.")
    private String description;

    @NotNull(message = "이력 발생일은 필수입니다.")
    private LocalDate occurredAt;

    // 미입력 시 배열 순서대로 서버가 매긴다.
    private Integer sortOrder;
}
