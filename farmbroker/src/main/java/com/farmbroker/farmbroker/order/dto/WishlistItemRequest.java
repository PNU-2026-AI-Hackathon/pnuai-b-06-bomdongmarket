package com.farmbroker.farmbroker.order.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

// 찜 추가 요청. 사용자는 인증 컨텍스트에서 식별하므로 body로 받지 않는다.
// 수량은 받지 않는다 — 찜은 관심 표시일 뿐이고 수량은 주문할 때 정한다.
@Getter
@NoArgsConstructor
@Schema(description = "찜 추가 요청")
public class WishlistItemRequest {

    @NotNull(message = "상품 ID는 필수입니다.")
    @Schema(description = "찜할 상품 ID", example = "1")
    private Long productId;
}
