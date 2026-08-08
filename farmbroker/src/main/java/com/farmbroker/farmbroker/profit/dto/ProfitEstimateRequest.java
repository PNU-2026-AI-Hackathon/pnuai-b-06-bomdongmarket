package com.farmbroker.farmbroker.profit.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

// 등록 전 수익 예측(POST /profit/estimate) 요청 바디.
// spaceId가 아니라 면적·월세를 직접 받으므로 아직 저장되지 않은 공간도 계산할 수 있다.
// 필드명과 검증 메시지는 SpaceCreateRequest의 같은 항목과 맞춘다.
@Getter
@NoArgsConstructor
@Schema(description = "등록 전 공간 조건 기반 수익 예측 요청")
public class ProfitEstimateRequest {

    private static final String AREA_MIN_EXCLUSIVE = "0.0";
    private static final long RENT_MIN = 0;

    private static final String MSG_AREA_REQUIRED = "면적은 필수입니다.";
    private static final String MSG_AREA_POSITIVE = "면적은 0보다 커야 합니다.";
    private static final String MSG_RENT_REQUIRED = "월세는 필수입니다.";
    private static final String MSG_RENT_MIN = "월세는 0 이상이어야 합니다.";

    @Schema(description = "공실 전체면적(㎡)", example = "66", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = MSG_AREA_REQUIRED)
    @DecimalMin(value = AREA_MIN_EXCLUSIVE, inclusive = false, message = MSG_AREA_POSITIVE)
    private BigDecimal area;

    @Schema(description = "공간 제공자가 원하는 월세(KRW)", example = "500000", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = MSG_RENT_REQUIRED)
    @Min(value = RENT_MIN, message = MSG_RENT_MIN)
    private Integer monthlyRent;
}
