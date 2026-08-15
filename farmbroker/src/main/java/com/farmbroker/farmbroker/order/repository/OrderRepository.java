package com.farmbroker.farmbroker.order.repository;

import com.farmbroker.farmbroker.order.domain.Order;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {

    @EntityGraph(attributePaths = "items")
    List<Order> findByBuyerIdOrderByCreatedAtDesc(Long buyerId);
}
