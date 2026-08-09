package com.farmbroker.farmbroker.product.domain;

// 상품 카테고리. 프론트는 한글 라벨('잎채소' 등)을 주고받으므로, API 계약상 category 값은 한글 라벨이다.
// 내부 저장/검증은 이 enum으로 하고, 라벨↔enum 변환은 fromLabel/getLabel로 처리한다.
// 카테고리를 늘릴 때는 뒤에 값을 추가한다.
public enum ProductCategory {
    LEAFY("잎채소"),
    HERB("허브"),
    FRUIT_VEGETABLE("과채류");

    private final String label;

    ProductCategory(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }

    // 한글 라벨 또는 enum 이름으로 매핑. 일치하는 값이 없으면 null → 호출부에서 검증 실패로 처리한다.
    public static ProductCategory fromLabel(String value) {
        if (value == null) {
            return null;
        }
        for (ProductCategory category : values()) {
            if (category.label.equals(value) || category.name().equals(value)) {
                return category;
            }
        }
        return null;
    }
}
