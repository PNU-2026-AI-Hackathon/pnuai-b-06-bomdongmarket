package com.farmbroker.farmbroker.product.domain;

// 상품 판매 상태. 판매자가 전환하며, 결제로 재고가 0이 되면 CLOSED로 자동 전환된다.
// ON_SALE: 판매 중 / CLOSED: 판매 마감(목록에는 남되 판매 종료 표시).
public enum ProductStatus {
    ON_SALE,
    CLOSED
}
