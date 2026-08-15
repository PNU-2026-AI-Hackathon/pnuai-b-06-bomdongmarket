package com.farmbroker.farmbroker.order.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

// 장바구니 담기 요청. 사용자는 인증 컨텍스트에서 식별하므로 body로 받지 않는다.
@Getter
@NoArgsConstructor
@Schema(description = "장바구니 담기 요청")
public class CartItemRequest {

    @NotNull(message = "상품 ID는 필수입니다.")
    @Schema(description = "담을 상품 ID", example = "1")
    private Long productId;

    @NotNull(message = "수량은 필수입니다.")
    @Min(value = 1, message = "수량은 1 이상이어야 합니다.")
    @Schema(description = "담을 수량", example = "2")
    private Integer quantity;
}
