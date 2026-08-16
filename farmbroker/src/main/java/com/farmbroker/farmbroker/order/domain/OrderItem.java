package com.farmbroker.farmbroker.order.domain;

import com.farmbroker.farmbroker.product.domain.Product;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

// 주문 한 줄. 상품명·단가·단위를 주문 시점 값으로 복사해 둔다 —
// 판매자가 나중에 가격을 바꾸거나 상품을 내려도 주문 내역이 달라지면 안 되기 때문이다.
// productId는 조회 편의를 위한 스냅샷이라 FK로 걸지 않는다(상품이 삭제돼도 주문은 남는다).
@Entity
@Table(name = "order_items")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @Column(nullable = false)
    private Long productId;

    @Column(nullable = false, length = 100)
    private String productName;

    @Column(nullable = false, length = 20)
    private String unit;

    @Column(nullable = false)
    private Integer unitPrice;

    @Column(nullable = false)
    private Integer quantity;

    public OrderItem(Product product, int quantity) {
        this.productId = product.getId();
        this.productName = product.getName();
        this.unit = product.getUnit();
        this.unitPrice = product.getPrice();
        this.quantity = quantity;
    }

    void assignTo(Order order) {
        this.order = order;
    }

    public int getLinePrice() {
        return unitPrice * quantity;
    }
}
