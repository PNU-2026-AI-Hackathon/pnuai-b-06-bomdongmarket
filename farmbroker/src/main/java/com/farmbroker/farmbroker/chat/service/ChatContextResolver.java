package com.farmbroker.farmbroker.chat.service;

import com.farmbroker.farmbroker.chat.domain.ChatContextType;
import com.farmbroker.farmbroker.common.exception.BusinessException;
import com.farmbroker.farmbroker.common.exception.ErrorCode;
import com.farmbroker.farmbroker.product.domain.Product;
import com.farmbroker.farmbroker.product.repository.ProductRepository;
import com.farmbroker.farmbroker.space.domain.Space;
import com.farmbroker.farmbroker.space.domain.SpaceImage;
import com.farmbroker.farmbroker.space.repository.SpaceImageRepository;
import com.farmbroker.farmbroker.space.repository.SpaceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Locale;

@Component
@RequiredArgsConstructor
public class ChatContextResolver {

    private final SpaceRepository spaceRepository;
    private final SpaceImageRepository spaceImageRepository;
    private final ProductRepository productRepository;

    public ContextTarget resolve(String contextTypeValue, Long contextId) {
        ChatContextType contextType = parseType(contextTypeValue);
        return switch (contextType) {
            case SPACE -> resolveSpace(contextId);
            case PRODUCT -> resolveProduct(contextId);
        };
    }

    private ContextTarget resolveSpace(Long spaceId) {
        Space space = spaceRepository.findByIdAndDeletedFalse(spaceId)
                .orElseThrow(() -> new BusinessException(ErrorCode.SPACE_NOT_FOUND));
        List<SpaceImage> images = spaceImageRepository.findBySpaceIdOrderBySortOrderAsc(spaceId);
        String imageUrl = images.isEmpty() ? null : images.getFirst().getImageUrl();
        return new ContextTarget(ChatContextType.SPACE, space.getId(), space.getTitle(),
                imageUrl, space.getOwner().getId());
    }

    private ContextTarget resolveProduct(Long productId) {
        Product product = productRepository.findByIdAndDeletedFalse(productId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PRODUCT_NOT_FOUND));
        return new ContextTarget(ChatContextType.PRODUCT, product.getId(), product.getName(),
                product.getImageUrl(), product.getSeller().getId());
    }

    private ChatContextType parseType(String value) {
        try {
            return ChatContextType.valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException | NullPointerException e) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR);
        }
    }

    public record ContextTarget(ChatContextType type, Long id, String title,
                                String imageUrl, Long ownerId) {
    }
}
