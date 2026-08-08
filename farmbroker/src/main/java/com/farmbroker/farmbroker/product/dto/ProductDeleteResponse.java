package com.farmbroker.farmbroker.product.dto;

import lombok.Getter;

// 상품 삭제(소프트 삭제) 응답.
@Getter
public class ProductDeleteResponse {

    private final Long productId;
    private final boolean deleted;

    private ProductDeleteResponse(Long productId, boolean deleted) {
        this.productId = productId;
        this.deleted = deleted;
    }

    public static ProductDeleteResponse of(Long productId, boolean deleted) {
        return new ProductDeleteResponse(productId, deleted);
    }
}
