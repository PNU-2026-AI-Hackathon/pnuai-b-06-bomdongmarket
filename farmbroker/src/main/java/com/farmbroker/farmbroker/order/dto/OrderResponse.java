package com.farmbroker.farmbroker.order.dto;

import com.farmbroker.farmbroker.order.domain.Order;
import com.farmbroker.farmbroker.order.domain.OrderItem;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

// 결제 확정 응답. 실제 결제(PG)는 붙이지 않았고 주문 기록과 재고 차감까지만 이뤄진다.
@Getter
@Schema(description = "확정된 주문")
public class OrderResponse {

    @Schema(description = "주문 ID", example = "1")
    private final Long orderId;
    @Schema(description = "결제 금액(원)", example = "12900")
    private final int totalPrice;
    @Schema(description = "주문 확정 시각")
    private final LocalDateTime createdAt;
    @Schema(description = "주문한 상품 목록")
    private final List<OrderLine> items;

    private OrderResponse(Order order) {
        this.orderId = order.getId();
        this.totalPrice = order.getTotalPrice();
        this.createdAt = order.getCreatedAt();
        this.items = order.getItems().stream().map(OrderLine::new).toList();
    }

    public static OrderResponse from(Order order) {
        return new OrderResponse(order);
    }

    @Getter
    @Schema(description = "주문 한 줄 — 주문 시점 값으로 고정된다")
    public static class OrderLine {

        @Schema(description = "상품 ID", example = "1")
        private final Long productId;
        @Schema(description = "주문 시점 상품명", example = "버터헤드 상추")
        private final String name;
        @Schema(description = "주문 시점 판매 단위", example = "200g")
        private final String unit;
        @Schema(description = "주문 시점 단가(원)", example = "4300")
        private final int unitPrice;
        @Schema(description = "주문 수량", example = "3")
        private final int quantity;
        @Schema(description = "단가 × 수량", example = "12900")
        private final int linePrice;

        OrderLine(OrderItem item) {
            this.productId = item.getProductId();
            this.name = item.getProductName();
            this.unit = item.getUnit();
            this.unitPrice = item.getUnitPrice();
            this.quantity = item.getQuantity();
            this.linePrice = item.getLinePrice();
        }
    }
}
