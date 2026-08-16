package com.farmbroker.farmbroker.order.service;

import com.farmbroker.farmbroker.common.exception.BusinessException;
import com.farmbroker.farmbroker.common.exception.ErrorCode;
import com.farmbroker.farmbroker.order.domain.Order;
import com.farmbroker.farmbroker.order.domain.OrderItem;
import com.farmbroker.farmbroker.order.dto.OrderCreateRequest;
import com.farmbroker.farmbroker.order.dto.OrderResponse;
import com.farmbroker.farmbroker.order.repository.OrderRepository;
import com.farmbroker.farmbroker.product.domain.Product;
import com.farmbroker.farmbroker.product.domain.ProductStatus;
import com.farmbroker.farmbroker.product.repository.ProductRepository;
import com.farmbroker.farmbroker.user.domain.User;
import com.farmbroker.farmbroker.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

// 주문 확정. 실제 결제(PG)는 연동하지 않는다 — 사업자 등록이 필요해 데모 범위 밖이다.
// 대신 주문을 기록하고 재고를 줄이는 것까지 처리해, 구매 후 마켓에서 실제로 수량이 줄고
// 다 팔리면 목록에서 내려가는 흐름을 그대로 보여 준다.
//
// 상품 하나가 주문 단위다. 거래는 채팅으로 협의하므로 여러 농부의 상품을 한 번에 결제하지 않는다.
// 나중에 채팅방에 '거래 확정'이 붙어도 이 메서드를 그대로 부르면 된다.
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    @Transactional
    public OrderResponse order(Long userId, OrderCreateRequest request) {
        User buyer = userRepository.findActiveByIdForUpdate(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        // 상품을 선로딩하지 않고 여기서 처음 잠근다. 이미 영속화된 엔티티에 잠금을 걸면
        // 행만 잠기고 상태를 다시 읽지 않아 stale 재고를 그대로 덮어쓴다.
        Product product = productRepository.findForUpdate(request.getProductId())
                .orElseThrow(() -> new BusinessException(ErrorCode.PRODUCT_NOT_FOUND));
        if (product.getStatus() != ProductStatus.ON_SALE) {
            throw new BusinessException(ErrorCode.PRODUCT_NOT_ON_SALE);
        }

        // 재고가 0이 되면 엔티티가 상태를 CLOSED로 바꿔 공개 목록에서 빠진다.
        product.reduceStock(request.getQuantity());

        Order order = new Order(buyer);
        order.addItem(new OrderItem(product, request.getQuantity()));
        orderRepository.save(order);
        return OrderResponse.from(order);
    }
}
