package com.farmbroker.farmbroker.order.service;

import com.farmbroker.farmbroker.common.exception.BusinessException;
import com.farmbroker.farmbroker.common.exception.ErrorCode;
import com.farmbroker.farmbroker.order.domain.CartItem;
import com.farmbroker.farmbroker.order.domain.Order;
import com.farmbroker.farmbroker.order.domain.OrderItem;
import com.farmbroker.farmbroker.order.dto.CartItemRequest;
import com.farmbroker.farmbroker.order.dto.CartResponse;
import com.farmbroker.farmbroker.order.dto.OrderResponse;
import com.farmbroker.farmbroker.order.repository.CartItemRepository;
import com.farmbroker.farmbroker.order.repository.OrderRepository;
import com.farmbroker.farmbroker.product.domain.Product;
import com.farmbroker.farmbroker.product.repository.ProductRepository;
import com.farmbroker.farmbroker.user.domain.User;
import com.farmbroker.farmbroker.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

// 장바구니와 결제.
// 실제 결제(PG)는 연동하지 않는다 — 사업자 등록이 필요해 데모 범위 밖이다.
// 대신 주문을 기록하고 재고를 줄이는 것까지 처리해, 결제 후 마켓에서 실제로 수량이 줄고
// 다 팔리면 목록에서 내려가는 흐름을 그대로 보여 준다.
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OrderService {

    private final CartItemRepository cartItemRepository;
    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    public CartResponse getCart(Long userId) {
        return CartResponse.from(cartItemRepository.findByUserIdOrderByCreatedAtAsc(userId));
    }

    // 같은 상품을 다시 담으면 줄을 늘리지 않고 수량을 더한다.
    @Transactional
    public CartResponse addToCart(Long userId, CartItemRequest request) {
        Product product = productRepository.findByIdAndDeletedFalse(request.getProductId())
                .orElseThrow(() -> new BusinessException(ErrorCode.PRODUCT_NOT_FOUND));
        if (!product.isPurchasable()) {
            throw new BusinessException(ErrorCode.PRODUCT_NOT_ON_SALE);
        }

        CartItem existing = cartItemRepository.findByUserIdAndProductId(userId, product.getId())
                .orElse(null);
        int requested = (existing == null ? 0 : existing.getQuantity()) + request.getQuantity();
        // 담는 시점에 재고를 넘으면 미리 막는다. 결제 시점에도 다시 검사한다.
        if (requested > product.getStock()) {
            throw new BusinessException(ErrorCode.OUT_OF_STOCK);
        }

        if (existing != null) {
            existing.addQuantity(request.getQuantity());
        } else {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
            cartItemRepository.save(CartItem.builder()
                    .user(user)
                    .product(product)
                    .quantity(request.getQuantity())
                    .build());
        }
        return getCart(userId);
    }

    @Transactional
    public CartResponse changeQuantity(Long userId, Long productId, int quantity) {
        CartItem item = cartItemRepository.findByUserIdAndProductId(userId, productId)
                .orElseThrow(() -> new BusinessException(ErrorCode.CART_ITEM_NOT_FOUND));
        if (quantity > item.getProduct().getStock()) {
            throw new BusinessException(ErrorCode.OUT_OF_STOCK);
        }
        item.changeQuantity(quantity);
        return getCart(userId);
    }

    @Transactional
    public CartResponse removeFromCart(Long userId, Long productId) {
        CartItem item = cartItemRepository.findByUserIdAndProductId(userId, productId)
                .orElseThrow(() -> new BusinessException(ErrorCode.CART_ITEM_NOT_FOUND));
        cartItemRepository.delete(item);
        return getCart(userId);
    }

    // 결제 확정 — 장바구니 전체를 주문으로 옮기고 재고를 줄인다.
    // 상품 행을 잠근 뒤 검사·차감하므로 동시에 같은 상품을 사도 재고가 음수가 되지 않는다.
    // 한 줄이라도 재고가 모자라면 전체를 되돌린다(부분 결제는 만들지 않는다).
    @Transactional
    public OrderResponse checkout(Long userId) {
        List<CartItem> cartItems = cartItemRepository.findByUserIdOrderByCreatedAtAsc(userId);
        if (cartItems.isEmpty()) {
            throw new BusinessException(ErrorCode.CART_EMPTY);
        }

        User buyer = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        Order order = new Order(buyer);

        for (CartItem cartItem : cartItems) {
            Product product = productRepository.findForUpdate(cartItem.getProduct().getId())
                    .orElseThrow(() -> new BusinessException(ErrorCode.PRODUCT_NOT_FOUND));
            if (product.getStatus() != com.farmbroker.farmbroker.product.domain.ProductStatus.ON_SALE) {
                throw new BusinessException(ErrorCode.PRODUCT_NOT_ON_SALE);
            }
            // 재고가 0이 되면 엔티티가 상태를 CLOSED로 바꿔 공개 목록에서 빠진다.
            product.reduceStock(cartItem.getQuantity());
            order.addItem(new OrderItem(product, cartItem.getQuantity()));
        }

        orderRepository.save(order);
        cartItemRepository.deleteByUserId(userId);
        return OrderResponse.from(order);
    }
}
