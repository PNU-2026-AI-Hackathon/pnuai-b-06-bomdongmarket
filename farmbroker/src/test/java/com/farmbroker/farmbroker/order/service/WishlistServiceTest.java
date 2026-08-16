package com.farmbroker.farmbroker.order.service;

import com.farmbroker.farmbroker.common.exception.BusinessException;
import com.farmbroker.farmbroker.common.exception.ErrorCode;
import com.farmbroker.farmbroker.order.domain.WishlistItem;
import com.farmbroker.farmbroker.order.repository.WishlistItemRepository;
import com.farmbroker.farmbroker.product.domain.Product;
import com.farmbroker.farmbroker.product.domain.ProductCategory;
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
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

// 찜은 관심 표시만 다룬다 — 수량도 결제도 없다.
@ExtendWith(MockitoExtension.class)
class WishlistServiceTest {

    @Mock
    private WishlistItemRepository wishlistItemRepository;
    @Mock
    private ProductRepository productRepository;
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private WishlistService wishlistService;

    private static User user(long id) {
        User user = User.builder().email("buyer@example.com").password("x").nickname("구매자").build();
        ReflectionTestUtils.setField(user, "id", id);
        return user;
    }

    private static Product product(long id, int stock) {
        Product product = Product.builder()
                .seller(user(99L))
                .name("버터헤드 상추")
                .category(ProductCategory.LEAFY)
                .price(4300)
                .unit("200g")
                .stock(stock)
                .harvestDate(LocalDate.of(2026, 8, 8))
                .productionLocation("장전 스마트팜")
                .build();
        ReflectionTestUtils.setField(product, "id", id);
        return product;
    }

    // 하트 버튼은 연타되기 쉬워 중복 추가가 오류가 되면 안 된다.
    @Test
    @DisplayName("이미 찜한 상품을 다시 찜해도 줄이 늘지 않는다")
    void adding_twice_keeps_single_row() {
        Product product = product(1L, 10);
        WishlistItem existing = WishlistItem.builder().user(user(1L)).product(product).build();
        given(userRepository.findActiveByIdForUpdate(1L)).willReturn(Optional.of(user(1L)));
        given(productRepository.findByIdAndDeletedFalse(1L)).willReturn(Optional.of(product));
        given(wishlistItemRepository.findByUserIdAndProductId(1L, 1L)).willReturn(Optional.of(existing));
        given(wishlistItemRepository.findByUserIdOrderByCreatedAtAsc(1L)).willReturn(List.of(existing));

        wishlistService.add(1L, 1L);

        verify(wishlistItemRepository, never()).save(any());
    }

    // 다시 올라오길 기다리는 것도 관심 표시다.
    @Test
    @DisplayName("품절된 상품도 찜할 수 있다")
    void can_wish_sold_out_product() {
        Product soldOut = product(1L, 0);
        given(userRepository.findActiveByIdForUpdate(1L)).willReturn(Optional.of(user(1L)));
        given(productRepository.findByIdAndDeletedFalse(1L)).willReturn(Optional.of(soldOut));
        given(wishlistItemRepository.findByUserIdAndProductId(1L, 1L)).willReturn(Optional.empty());
        given(wishlistItemRepository.findByUserIdOrderByCreatedAtAsc(1L)).willReturn(List.of());

        wishlistService.add(1L, 1L);

        verify(wishlistItemRepository).save(any(WishlistItem.class));
    }

    @Test
    @DisplayName("찜하지 않은 상품을 해제하려 하면 막는다")
    void removing_unwished_product_is_rejected() {
        given(userRepository.findActiveByIdForUpdate(1L)).willReturn(Optional.of(user(1L)));
        given(wishlistItemRepository.findByUserIdAndProductId(1L, 1L)).willReturn(Optional.empty());

        assertThatThrownBy(() -> wishlistService.remove(1L, 1L))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.WISHLIST_ITEM_NOT_FOUND);
    }
}
