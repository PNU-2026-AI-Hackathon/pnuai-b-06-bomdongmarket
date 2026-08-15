package com.farmbroker.farmbroker.order.service;

import com.farmbroker.farmbroker.common.exception.BusinessException;
import com.farmbroker.farmbroker.common.exception.ErrorCode;
import com.farmbroker.farmbroker.order.domain.CartItem;
import com.farmbroker.farmbroker.order.dto.CartResponse;
import com.farmbroker.farmbroker.order.dto.OrderResponse;
import com.farmbroker.farmbroker.order.repository.CartItemRepository;
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
import org.mockito.InOrder;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

// 장바구니·결제의 핵심 규칙을 검증한다.
// DB 없이 돌도록 레포지토리는 목으로 대체한다(이 프로젝트는 H2 없이 MySQL만 쓴다).
@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private CartItemRepository cartItemRepository;
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

    private static CartItem cartItem(Product product, int quantity) {
        return CartItem.builder().user(user(1L)).product(product).quantity(quantity).build();
    }

    @Test
    @DisplayName("결제하면 담은 수량만큼 재고가 줄어든다")
    void checkout_reduces_stock() {
        Product product = product(1L, 4300, 10);
        given(cartItemRepository.findByUserIdForUpdate(1L))
                .willReturn(List.of(cartItem(product, 3)));
        given(userRepository.findById(1L)).willReturn(Optional.of(user(1L)));
        given(productRepository.findForUpdate(1L)).willReturn(Optional.of(product));

        OrderResponse response = orderService.checkout(1L);

        assertThat(product.getStock()).isEqualTo(7);
        assertThat(product.getStatus()).isEqualTo(ProductStatus.ON_SALE);
        assertThat(response.getTotalPrice()).isEqualTo(12_900);
        verify(cartItemRepository).findByUserIdForUpdate(1L);
        verify(cartItemRepository, never()).findByUserIdOrderByCreatedAtAsc(anyLong());
    }

    @Test
    @DisplayName("재고를 모두 사면 판매 마감으로 바뀌어 공개 목록에서 빠진다")
    void checkout_closes_product_when_stock_hits_zero() {
        Product product = product(1L, 4300, 3);
        given(cartItemRepository.findByUserIdForUpdate(1L))
                .willReturn(List.of(cartItem(product, 3)));
        given(userRepository.findById(1L)).willReturn(Optional.of(user(1L)));
        given(productRepository.findForUpdate(1L)).willReturn(Optional.of(product));

        orderService.checkout(1L);

        assertThat(product.getStock()).isZero();
        assertThat(product.getStatus()).isEqualTo(ProductStatus.CLOSED);
        assertThat(product.isPurchasable()).isFalse();
    }

    @Test
    @DisplayName("재고보다 많이 결제하려 하면 막고 재고를 건드리지 않는다")
    void checkout_rejects_when_stock_is_short() {
        Product product = product(1L, 4300, 2);
        given(cartItemRepository.findByUserIdForUpdate(1L))
                .willReturn(List.of(cartItem(product, 5)));
        given(userRepository.findById(1L)).willReturn(Optional.of(user(1L)));
        given(productRepository.findForUpdate(1L)).willReturn(Optional.of(product));

        assertThatThrownBy(() -> orderService.checkout(1L))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.OUT_OF_STOCK);
        assertThat(product.getStock()).isEqualTo(2);
    }

    @Test
    @DisplayName("빈 장바구니로는 결제할 수 없다")
    void checkout_rejects_empty_cart() {
        given(cartItemRepository.findByUserIdForUpdate(1L)).willReturn(List.of());

        assertThatThrownBy(() -> orderService.checkout(1L))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.CART_EMPTY);
    }

    @Test
    @DisplayName("결제 전 상품 잠금을 상품 ID 오름차순으로 획득한다")
    void checkout_locks_products_in_id_order() {
        Product later = product(20L, 4300, 10);
        Product earlier = product(10L, 2500, 10);
        given(cartItemRepository.findByUserIdForUpdate(1L))
                .willReturn(List.of(cartItem(later, 1), cartItem(earlier, 1)));
        given(userRepository.findById(1L)).willReturn(Optional.of(user(1L)));
        given(productRepository.findForUpdate(10L)).willReturn(Optional.of(earlier));
        given(productRepository.findForUpdate(20L)).willReturn(Optional.of(later));

        OrderResponse response = orderService.checkout(1L);

        InOrder lockOrder = inOrder(productRepository);
        lockOrder.verify(productRepository).findForUpdate(10L);
        lockOrder.verify(productRepository).findForUpdate(20L);
        assertThat(response.getItems())
                .extracting(OrderResponse.OrderLine::getProductId)
                .containsExactly(20L, 10L);
    }

    @Test
    @DisplayName("같은 상품을 다시 담으면 줄이 늘지 않고 수량이 더해진다")
    void adding_same_product_merges_quantity() {
        Product product = product(1L, 4300, 10);
        CartItem existing = cartItem(product, 2);
        given(productRepository.findByIdAndDeletedFalse(1L)).willReturn(Optional.of(product));
        given(cartItemRepository.findByUserIdAndProductId(1L, 1L)).willReturn(Optional.of(existing));
        given(cartItemRepository.findByUserIdOrderByCreatedAtAsc(1L)).willReturn(List.of(existing));

        orderService.addToCart(1L, request(1L, 3));

        assertThat(existing.getQuantity()).isEqualTo(5);
    }

    @Test
    @DisplayName("판매 마감된 상품은 담을 수 없다")
    void cannot_add_closed_product() {
        Product product = product(1L, 4300, 0);
        given(productRepository.findByIdAndDeletedFalse(1L)).willReturn(Optional.of(product));

        assertThatThrownBy(() -> orderService.addToCart(1L, request(1L, 1)))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.PRODUCT_NOT_ON_SALE);
    }

    @Test
    @DisplayName("담아 둔 뒤 재고가 줄면 그 줄은 결제 대상에서 빠진다")
    void cart_marks_line_unpurchasable_when_stock_dropped() {
        Product product = product(1L, 4300, 1);
        given(cartItemRepository.findByUserIdOrderByCreatedAtAsc(1L))
                .willReturn(List.of(cartItem(product, 3)));

        CartResponse cart = orderService.getCart(1L);

        assertThat(cart.getItems()).hasSize(1);
        assertThat(cart.getItems().get(0).isPurchasable()).isFalse();
        // 살 수 없는 줄은 결제 예정 금액에 넣지 않는다
        assertThat(cart.getTotalPrice()).isZero();
    }

    private static com.farmbroker.farmbroker.order.dto.CartItemRequest request(Long productId, int quantity) {
        var request = new com.farmbroker.farmbroker.order.dto.CartItemRequest();
        ReflectionTestUtils.setField(request, "productId", productId);
        ReflectionTestUtils.setField(request, "quantity", quantity);
        return request;
    }
}
