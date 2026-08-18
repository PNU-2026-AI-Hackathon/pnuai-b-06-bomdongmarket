package com.farmbroker.farmbroker.order.service;

import com.farmbroker.farmbroker.common.exception.BusinessException;
import com.farmbroker.farmbroker.common.exception.ErrorCode;
import com.farmbroker.farmbroker.order.dto.OrderCreateRequest;
import com.farmbroker.farmbroker.order.dto.OrderResponse;
import com.farmbroker.farmbroker.order.repository.OrderRepository;
import com.farmbroker.farmbroker.product.domain.Product;
import com.farmbroker.farmbroker.product.domain.ProductCategory;
import com.farmbroker.farmbroker.product.domain.ProductStatus;
import com.farmbroker.farmbroker.product.repository.ProductRepository;
import com.farmbroker.farmbroker.user.domain.User;
import com.farmbroker.farmbroker.user.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

// 주문 확정의 핵심 규칙을 검증한다. 상품 하나가 주문 단위다.
// DB 없이 돌도록 레포지토리는 목으로 대체한다.
@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;
    @Mock
    private ProductRepository productRepository;
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private OrderService orderService;

    private static User user(long id) {
        User user = User.builder().email("buyer@example.com").password("x").nickname("구매자").build();
        ReflectionTestUtils.setField(user, "id", id);
        return user;
    }

    private static Product product(long id, int price, int stock) {
        Product product = Product.builder()
                .seller(user(99L))
                .name("버터헤드 상추")
                .category(ProductCategory.LEAFY)
                .price(price)
                .unit("200g")
                .stock(stock)
                .harvestDate(LocalDate.of(2026, 8, 8))
                .productionLocation("장전 스마트팜")
                .build();
        ReflectionTestUtils.setField(product, "id", id);
        return product;
    }

    private static OrderCreateRequest request(Long productId, int quantity) {
        OrderCreateRequest request = new OrderCreateRequest();
        ReflectionTestUtils.setField(request, "productId", productId);
        ReflectionTestUtils.setField(request, "quantity", quantity);
        return request;
    }

    @Test
    @DisplayName("주문하면 그 상품 재고가 수량만큼 줄어든다")
    void order_reduces_stock() {
        Product product = product(1L, 4300, 10);
        given(userRepository.findActiveByIdForUpdate(1L)).willReturn(Optional.of(user(1L)));
        given(productRepository.findForUpdate(1L)).willReturn(Optional.of(product));

        OrderResponse response = orderService.order(1L, request(1L, 3));

        assertThat(product.getStock()).isEqualTo(7);
        assertThat(product.getStatus()).isEqualTo(ProductStatus.ON_SALE);
        assertThat(response.getTotalPrice()).isEqualTo(12_900);
    }

    // 선로딩된 엔티티에 잠금을 걸면 상태를 다시 읽지 않아 stale 재고를 덮어쓴다.
    @Test
    @DisplayName("상품은 잠금 조회로 가져온다")
    void order_locks_product_row() {
        Product product = product(1L, 4300, 10);
        given(userRepository.findActiveByIdForUpdate(1L)).willReturn(Optional.of(user(1L)));
        given(productRepository.findForUpdate(1L)).willReturn(Optional.of(product));

        orderService.order(1L, request(1L, 1));

        verify(productRepository).findForUpdate(1L);
    }

    @Test
    @DisplayName("재고를 모두 사면 판매 마감으로 바뀌어 공개 목록에서 빠진다")
    void order_closes_product_when_stock_hits_zero() {
        Product product = product(1L, 4300, 3);
        given(userRepository.findActiveByIdForUpdate(1L)).willReturn(Optional.of(user(1L)));
        given(productRepository.findForUpdate(1L)).willReturn(Optional.of(product));

        orderService.order(1L, request(1L, 3));

        assertThat(product.getStock()).isZero();
        assertThat(product.getStatus()).isEqualTo(ProductStatus.CLOSED);
        assertThat(product.isPurchasable()).isFalse();
    }

    @Test
    @DisplayName("재고보다 많이 주문하면 막고 재고를 건드리지 않는다")
    void order_rejects_when_stock_is_short() {
        Product product = product(1L, 4300, 2);
        given(userRepository.findActiveByIdForUpdate(1L)).willReturn(Optional.of(user(1L)));
        given(productRepository.findForUpdate(1L)).willReturn(Optional.of(product));

        assertThatThrownBy(() -> orderService.order(1L, request(1L, 5)))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.OUT_OF_STOCK);
        assertThat(product.getStock()).isEqualTo(2);
    }

    @Test
    @DisplayName("판매 마감된 상품은 주문할 수 없다")
    void order_rejects_closed_product() {
        // 재고만 0으로 만들면 상태는 아직 ON_SALE이다. 다 팔려 CLOSED가 된 상황을 만든다.
        Product product = product(1L, 4300, 1);
        product.reduceStock(1);
        given(userRepository.findActiveByIdForUpdate(1L)).willReturn(Optional.of(user(1L)));
        given(productRepository.findForUpdate(1L)).willReturn(Optional.of(product));

        assertThatThrownBy(() -> orderService.order(1L, request(1L, 1)))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.PRODUCT_NOT_ON_SALE);
    }
}
