package com.farmbroker.farmbroker.product.repository;

import com.farmbroker.farmbroker.product.domain.ProductTraceabilityEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

// 생산 이력 이벤트 조회/관리 (SpaceImageRepository와 동일한 역할).
public interface ProductTraceabilityEventRepository extends JpaRepository<ProductTraceabilityEvent, Long> {

    // 상세 표시용 — 표시 순서 → 발생일 순
    List<ProductTraceabilityEvent> findByProductIdOrderBySortOrderAscOccurredAtAsc(Long productId);

    // 수정 시 전량 교체를 위한 삭제
    void deleteByProductId(Long productId);

    // 목록 카드의 '이력 확인' 뱃지 계산용 — 이벤트가 존재하는 상품 id만 한 번에 조회(N+1 방지)
    @Query("select distinct e.product.id from ProductTraceabilityEvent e where e.product.id in :productIds")
    List<Long> findProductIdsWithEvents(@Param("productIds") List<Long> productIds);
}
