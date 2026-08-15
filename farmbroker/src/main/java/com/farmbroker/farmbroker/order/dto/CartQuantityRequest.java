package com.farmbroker.farmbroker.order.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

// 장바구니 수량 변경 요청. 0으로 줄이는 대신 삭제 API를 쓴다.
@Getter
@NoArgsConstructor
@Schema(description = "장바구니 수량 변경 요청")
public class CartQuantityRequest {

    @NotNull(message = "수량은 필수입니다.")
    @Min(value = 1, message = "수량은 1 이상이어야 합니다.")
    @Schema(description = "변경할 수량", example = "3")
    private Integer quantity;
}
