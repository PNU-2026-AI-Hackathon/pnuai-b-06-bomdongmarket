package com.farmbroker.farmbroker.product.dto;

import com.farmbroker.farmbroker.product.domain.Product;
import lombok.Getter;

import java.time.LocalDate;
import java.util.List;

// 마켓 목록/내 판매 카드 UI용 요약 DTO. category는 한글 라벨로 노출한다.
// freshnessTags는 서버에서 파생해 주입한다(오늘 수확/이력 확인/근거리 농장/낮은 푸드 마일리지).
@Getter
public class ProductListItemResponse {

    private final Long productId;
    private final String name;
    private final String category;
    private final String productionLocation;
    private final String producerName;
    private final LocalDate harvestDate;
    private final Integer price;
    private final String unit;
    private final String imageUrl;
    private final Double foodMileageKm;
    private final Integer stock;
    private final String status;
    private final List<String> freshnessTags;

    private ProductListItemResponse(Product product, List<String> freshnessTags) {
        this.productId = product.getId();
        this.name = product.getName();
        this.category = product.getCategory().getLabel();
        this.productionLocation = product.getProductionLocation();
        this.producerName = product.getProducerName();
        this.harvestDate = product.getHarvestDate();
        this.price = product.getPrice();
        this.unit = product.getUnit();
        this.imageUrl = product.getImageUrl();
        this.foodMileageKm = product.getFoodMileageKm();
        this.stock = product.getStock();
        this.status = product.getStatus().name();
        this.freshnessTags = freshnessTags;
    }

    public static ProductListItemResponse from(Product product, List<String> freshnessTags) {
        return new ProductListItemResponse(product, freshnessTags);
    }
}
