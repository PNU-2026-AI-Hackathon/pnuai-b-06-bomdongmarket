package com.farmbroker.farmbroker.order.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

// 주문 확정 요청. 상품 하나를 사는 단위다.
// 거래는 채팅으로 협의하므로 여러 농부의 상품을 한 번에 결제하지 않는다.
// 나중에 채팅방에서 '거래 확정'을 붙일 때도 이 요청을 그대로 쓴다.
@Getter
@NoArgsConstructor
@Schema(description = "주문 확정 요청")
public class OrderCreateRequest {

    @NotNull(message = "상품 ID는 필수입니다.")
    @Schema(description = "주문할 상품 ID", example = "1")
    private Long productId;

    @NotNull(message = "수량은 필수입니다.")
    @Min(value = 1, message = "수량은 1 이상이어야 합니다.")
    @Schema(description = "주문 수량", example = "2")
    private Integer quantity;
}
