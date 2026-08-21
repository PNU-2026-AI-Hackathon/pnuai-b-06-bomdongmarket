package com.farmbroker.farmbroker.order.service;

import com.farmbroker.farmbroker.common.exception.BusinessException;
import com.farmbroker.farmbroker.common.exception.ErrorCode;
import com.farmbroker.farmbroker.order.domain.Order;
import com.farmbroker.farmbroker.order.dto.OrderCreateRequest;
import com.farmbroker.farmbroker.order.repository.OrderRepository;
import com.farmbroker.farmbroker.product.domain.Product;
import com.farmbroker.farmbroker.product.domain.ProductCategory;
import com.farmbroker.farmbroker.product.repository.ProductRepository;
import com.farmbroker.farmbroker.user.domain.User;
import com.farmbroker.farmbroker.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

// 자기 상품을 사면 재고만 줄고 거래는 없다. 화면에서 버튼을 감춰도 API 를 직접 부를 수 있어
// 서버에서 막아야 한다.
class OrderSelfPurchaseTest {

    private static final long SELLER_ID = 10L;
    private static final long BUYER_ID = 20L;
    private static final long PRODUCT_ID = 100L;

    private OrderRepository orderRepository;
    private ProductRepository productRepository;
    private UserRepository userRepository;
    private OrderService orderService;

    @BeforeEach
    void setUp() {
        orderRepository = mock(OrderRepository.class);
        productRepository = mock(ProductRepository.class);
        userRepository = mock(UserRepository.class);
        orderService = new OrderService(orderRepository, productRepository, userRepository);
    }

    @Test
    @DisplayName("판매자가 자기 상품을 주문하면 막고 재고를 건드리지 않는다")
    void rejectsSelfPurchase() {
        User seller = user(SELLER_ID);
        Product product = product(seller, 10);
        when(userRepository.findActiveByIdForUpdate(SELLER_ID)).thenReturn(Optional.of(seller));
        when(productRepository.findForUpdate(PRODUCT_ID)).thenReturn(Optional.of(product));

        assertThatThrownBy(() -> orderService.order(SELLER_ID, request(2)))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.ORDER_SELF_PURCHASE);

        assertThat(product.getStock()).isEqualTo(10);
        verify(orderRepository, never()).save(any());
    }

    @Test
    @DisplayName("다른 사람은 그대로 주문할 수 있다")
    void allowsOtherBuyer() {
        User seller = user(SELLER_ID);
        User buyer = user(BUYER_ID);
        Product product = product(seller, 10);
        when(userRepository.findActiveByIdForUpdate(BUYER_ID)).thenReturn(Optional.of(buyer));
        when(productRepository.findForUpdate(PRODUCT_ID)).thenReturn(Optional.of(product));
        when(orderRepository.save(any(Order.class))).thenAnswer(call -> call.getArgument(0));

        orderService.order(BUYER_ID, request(2));

        assertThat(product.getStock()).isEqualTo(8);
        verify(orderRepository).save(any(Order.class));
    }

    private User user(long id) {
        User user = User.builder()
                .email("user%d@example.com".formatted(id))
                .password("encoded")
                .nickname("사용자%d".formatted(id))
                .build();
        ReflectionTestUtils.setField(user, "id", id);
        return user;
    }

    private Product product(User seller, int stock) {
        Product product = new Product(seller, "버터헤드 상추", ProductCategory.LEAFY,
                4300, "200g", stock, null, null, LocalDate.of(2026, 8, 19),
                "상추농장", "부산 금정구", null, null, null, null, null);
        ReflectionTestUtils.setField(product, "id", PRODUCT_ID);
        return product;
    }

    private OrderCreateRequest request(int quantity) {
        OrderCreateRequest request = new OrderCreateRequest();
        ReflectionTestUtils.setField(request, "productId", PRODUCT_ID);
        ReflectionTestUtils.setField(request, "quantity", quantity);
        return request;
    }
}
