package com.farmbroker.farmbroker.product.domain;

// 상품 판매 상태. 주문/결제가 범위 밖이라 상태 전환은 판매자가 수동으로 한다.
// ON_SALE: 판매 중 / CLOSED: 판매 마감(목록에는 남되 판매 종료 표시).
public enum ProductStatus {
    ON_SALE,
    CLOSED
}
