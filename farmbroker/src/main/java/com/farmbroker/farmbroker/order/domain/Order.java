package com.farmbroker.farmbroker.order.domain;

import com.farmbroker.farmbroker.user.domain.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

// 결제 확정 기록. 실제 결제(PG)는 연동하지 않고 주문 확정과 재고 차감까지만 처리한다.
// order는 MySQL 예약어라 테이블명을 orders로 둔다.
@Entity
@Table(name = "orders")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "buyer_id", nullable = false)
    private User buyer;

    @Column(nullable = false)
    private Integer totalPrice;

    // 주문 줄은 주문 없이 존재할 이유가 없어 생명주기를 함께 둔다.
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private final List<OrderItem> items = new ArrayList<>();

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public Order(User buyer) {
        this.buyer = buyer;
        this.totalPrice = 0;
    }

    public void addItem(OrderItem item) {
        items.add(item);
        item.assignTo(this);
        this.totalPrice += item.getLinePrice();
    }
}
