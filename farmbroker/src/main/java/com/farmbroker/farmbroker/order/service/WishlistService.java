package com.farmbroker.farmbroker.order.service;

import com.farmbroker.farmbroker.common.exception.BusinessException;
import com.farmbroker.farmbroker.common.exception.ErrorCode;
import com.farmbroker.farmbroker.order.domain.WishlistItem;
import com.farmbroker.farmbroker.order.dto.WishlistResponse;
import com.farmbroker.farmbroker.order.repository.WishlistItemRepository;
import com.farmbroker.farmbroker.product.domain.Product;
import com.farmbroker.farmbroker.product.repository.ProductRepository;
import com.farmbroker.farmbroker.user.domain.User;
import com.farmbroker.farmbroker.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

// 찜(좋아요). 거래는 채팅으로 하므로 여기서는 관심 표시만 다룬다 — 수량도 결제도 없다.
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class WishlistService {

    private final WishlistItemRepository wishlistItemRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    public WishlistResponse get(Long userId) {
        return WishlistResponse.from(wishlistItemRepository.findByUserIdOrderByCreatedAtAsc(userId));
    }

    // 하트 버튼은 연타되기 쉽다. 이미 찜한 상품이면 오류 없이 지금 목록을 그대로 돌려준다.
    // 품절·마감 상품도 찜은 허용한다 — 다시 올라오길 기다리는 것도 관심 표시다.
    @Transactional
    public WishlistResponse add(Long userId, Long productId) {
        User user = getActiveUserForUpdate(userId);
        Product product = productRepository.findByIdAndDeletedFalse(productId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PRODUCT_NOT_FOUND));

        if (wishlistItemRepository.findByUserIdAndProductId(userId, product.getId()).isEmpty()) {
            wishlistItemRepository.save(WishlistItem.builder()
                    .user(user)
                    .product(product)
                    .build());
        }
        return get(userId);
    }

    @Transactional
    public WishlistResponse remove(Long userId, Long productId) {
        getActiveUserForUpdate(userId);
        WishlistItem item = wishlistItemRepository.findByUserIdAndProductId(userId, productId)
                .orElseThrow(() -> new BusinessException(ErrorCode.WISHLIST_ITEM_NOT_FOUND));
        wishlistItemRepository.delete(item);
        return get(userId);
    }

    private User getActiveUserForUpdate(Long userId) {
        return userRepository.findActiveByIdForUpdate(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
    }
}
