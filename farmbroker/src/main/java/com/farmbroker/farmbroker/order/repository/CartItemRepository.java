package com.farmbroker.farmbroker.order.repository;

import com.farmbroker.farmbroker.order.domain.CartItem;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CartItemRepository extends JpaRepository<CartItem, Long> {

    // 장바구니 화면은 상품 정보(이름·가격·재고)를 함께 보여 주므로 N+1을 피해 한 번에 가져온다.
    @EntityGraph(attributePaths = "product")
    List<CartItem> findByUserIdOrderByCreatedAtAsc(Long userId);

    Optional<CartItem> findByUserIdAndProductId(Long userId, Long productId);

    void deleteByUserId(Long userId);
}
