package com.farmbroker.farmbroker.order.dto;

import com.farmbroker.farmbroker.order.domain.CartItem;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;

import java.util.List;

// 장바구니 조회 응답.
// 담아 둔 뒤 판매자가 품절·마감했을 수 있어 각 줄에 현재 구매 가능 여부와 재고를 함께 내려준다.
// 프론트는 purchasable=false인 줄을 결제 대상에서 빼고 사유를 보여 준다.
@Getter
@Schema(description = "내 장바구니")
public class CartResponse {

    @Schema(description = "장바구니에 담긴 상품 목록")
    private final List<CartLine> items;
    @Schema(description = "지금 구매 가능한 줄만 더한 결제 예정 금액", example = "12900")
    private final int totalPrice;

    private CartResponse(List<CartLine> items, int totalPrice) {
        this.items = items;
        this.totalPrice = totalPrice;
    }

    public static CartResponse from(List<CartItem> cartItems) {
        List<CartLine> lines = cartItems.stream().map(CartLine::from).toList();
        int total = lines.stream()
                .filter(CartLine::isPurchasable)
                .mapToInt(CartLine::getLinePrice)
                .sum();
        return new CartResponse(lines, total);
    }

    @Getter
    @Schema(description = "장바구니 한 줄")
    public static class CartLine {

        @Schema(description = "상품 ID", example = "1")
        private final Long productId;
        @Schema(description = "상품명", example = "버터헤드 상추")
        private final String name;
        @Schema(description = "판매 단위", example = "200g")
        private final String unit;
        @Schema(description = "단가(원)", example = "4300")
        private final int price;
        @Schema(description = "담은 수량", example = "3")
        private final int quantity;
        @Schema(description = "단가 × 수량", example = "12900")
        private final int linePrice;
        @Schema(description = "대표 이미지 URL", nullable = true)
        private final String imageUrl;
        @Schema(description = "판매자가 남긴 현재 재고", example = "24")
        private final int stock;
        @Schema(description = "지금 결제 가능한지 — 마감·품절·재고 부족이면 false")
        private final boolean purchasable;

        private CartLine(CartItem item, boolean purchasable) {
            this.productId = item.getProduct().getId();
            this.name = item.getProduct().getName();
            this.unit = item.getProduct().getUnit();
            this.price = item.getProduct().getPrice();
            this.quantity = item.getQuantity();
            this.linePrice = item.totalPrice();
            this.imageUrl = item.getProduct().getImageUrl();
            this.stock = item.getProduct().getStock() == null ? 0 : item.getProduct().getStock();
            this.purchasable = purchasable;
        }

        static CartLine from(CartItem item) {
            boolean purchasable = item.getProduct().isPurchasable()
                    && item.getProduct().getStock() >= item.getQuantity();
            return new CartLine(item, purchasable);
        }
    }
}
