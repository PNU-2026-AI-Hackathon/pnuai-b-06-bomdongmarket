package com.farmbroker.farmbroker.order.repository;

import com.farmbroker.farmbroker.order.domain.CartItem;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CartItemRepository extends JpaRepository<CartItem, Long> {

    // 장바구니 화면은 상품 정보(이름·가격·재고)를 함께 보여 주므로 N+1을 피해 한 번에 가져온다.
    @EntityGraph(attributePaths = "product")
    List<CartItem> findByUserIdOrderByCreatedAtAsc(Long userId);

    // 결제 확정 전용 — 같은 사용자의 결제가 겹치면 장바구니를 두 번 주문으로 옮기게 되므로 행을 잠그고 읽는다.
    // 상품을 함께 로딩하지 않는 것이 핵심이다. @EntityGraph로 Product를 미리 영속화하면
    // 뒤이은 findForUpdate가 행만 잠그고 상태를 다시 읽지 않아 stale 재고를 덮어쓴다.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select ci from CartItem ci where ci.user.id = :userId order by ci.createdAt asc")
    List<CartItem> findByUserIdForUpdate(@Param("userId") Long userId);

    Optional<CartItem> findByUserIdAndProductId(Long userId, Long productId);

    void deleteByUserId(Long userId);
}
