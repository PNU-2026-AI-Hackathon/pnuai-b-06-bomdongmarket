package com.farmbroker.farmbroker.order.repository;

import com.farmbroker.farmbroker.order.domain.WishlistItem;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface WishlistItemRepository extends JpaRepository<WishlistItem, Long> {

    // 찜 목록 화면은 상품 정보(이름·가격·재고)를 함께 보여 주므로 N+1을 피해 한 번에 가져온다.
    @EntityGraph(attributePaths = "product")
    List<WishlistItem> findByUserIdOrderByCreatedAtAsc(Long userId);

    Optional<WishlistItem> findByUserIdAndProductId(Long userId, Long productId);

    void deleteByUserId(Long userId);
}
