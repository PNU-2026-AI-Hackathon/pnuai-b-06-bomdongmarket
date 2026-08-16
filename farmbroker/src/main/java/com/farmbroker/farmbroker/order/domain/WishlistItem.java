package com.farmbroker.farmbroker.order.domain;

import com.farmbroker.farmbroker.product.domain.Product;
import com.farmbroker.farmbroker.user.domain.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

// 찜한 상품 한 줄. 찜 자체를 엔티티로 두지 않고 (사용자, 상품) 조합으로 관리한다 —
// 사용자당 찜 목록은 하나뿐이라 별도 테이블을 두면 조인만 늘어난다.
//
// 수량을 두지 않는다. 거래는 채팅으로 협의하고 주문은 상품 단위로 확정하므로
// 미리 담아 둔 수량은 의미가 없다. 수량이 붙는 순간 이름만 찜이고 실체는 장바구니가 된다.
@Entity
@Table(
        name = "wishlist_items",
        indexes = @Index(name = "idx_wishlist_user_id", columnList = "user_id"),
        uniqueConstraints = @UniqueConstraint(
                name = "uk_wishlist_user_product", columnNames = {"user_id", "product_id"})
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class WishlistItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Builder
    public WishlistItem(User user, Product product) {
        this.user = user;
        this.product = product;
    }
}
