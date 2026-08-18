package com.farmbroker.farmbroker.order.dto;

import com.farmbroker.farmbroker.order.domain.WishlistItem;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;

import java.util.List;

// 찜 목록 조회 응답.
// 찜해 둔 사이 판매자가 품절·마감했을 수 있어 각 줄에 현재 구매 가능 여부와 재고를 함께 내려준다.
// 합계 금액은 없다 — 찜은 한 번에 결제하는 묶음이 아니라 관심 목록이다.
@Getter
@Schema(description = "내 찜 목록")
public class WishlistResponse {

    @Schema(description = "찜한 상품 목록")
    private final List<WishlistLine> items;

    private WishlistResponse(List<WishlistLine> items) {
        this.items = items;
    }

    public static WishlistResponse from(List<WishlistItem> wishlistItems) {
        return new WishlistResponse(wishlistItems.stream().map(WishlistLine::from).toList());
    }

    @Getter
    @Schema(description = "찜한 상품 한 줄")
    public static class WishlistLine {

        @Schema(description = "상품 ID", example = "1")
        private final Long productId;
        @Schema(description = "상품명", example = "버터헤드 상추")
        private final String name;
        @Schema(description = "판매 단위", example = "200g")
        private final String unit;
        @Schema(description = "단가(원)", example = "4300")
        private final int price;
        @Schema(description = "대표 이미지 URL", nullable = true)
        private final String imageUrl;
        @Schema(description = "판매자가 남긴 현재 재고", example = "24")
        private final int stock;
        @Schema(description = "지금 살 수 있는지 — 마감·품절이면 false")
        private final boolean purchasable;

        private WishlistLine(WishlistItem item) {
            this.productId = item.getProduct().getId();
            this.name = item.getProduct().getName();
            this.unit = item.getProduct().getUnit();
            this.price = item.getProduct().getPrice();
            this.imageUrl = item.getProduct().getImageUrl();
            this.stock = item.getProduct().getStock() == null ? 0 : item.getProduct().getStock();
            this.purchasable = item.getProduct().isPurchasable();
        }

        static WishlistLine from(WishlistItem item) {
            return new WishlistLine(item);
        }
    }
}
