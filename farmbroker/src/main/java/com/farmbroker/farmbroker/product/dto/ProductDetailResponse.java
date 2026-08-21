package com.farmbroker.farmbroker.product.dto;

import com.farmbroker.farmbroker.product.domain.Product;
import com.farmbroker.farmbroker.product.domain.ProductTraceabilityEvent;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

// 마켓 상품 상세 응답. 판매자 닉네임·위치·생산 이력 이벤트를 포함한다.
// category는 한글 라벨, freshnessTags는 서버 파생, latitude/longitude/foodMileageKm는 null 가능(Task 3 전).
@Getter
public class ProductDetailResponse {

    private final Long productId;
    // 화면이 "내가 등록한 상품"인지 판단할 수 있어야 구매 버튼을 감출 수 있다.
    private final Long sellerId;
    private final String sellerNickname;
    private final String name;
    private final String category;
    private final Integer price;
    private final String unit;
    private final Integer stock;
    private final String imageUrl;
    private final String description;
    private final LocalDate harvestDate;
    private final String producerName;
    private final String productionLocation;
    private final String address;
    private final Double latitude;
    private final Double longitude;
    private final Long spaceId;
    private final Double foodMileageKm;
    private final String status;
    private final List<String> freshnessTags;
    private final LocalDateTime createdAt;
    private final List<TraceabilityEventResponse> traceabilityEvents;

    private ProductDetailResponse(Product product, String sellerNickname, List<String> freshnessTags,
                                  List<ProductTraceabilityEvent> events) {
        this.productId = product.getId();
        this.sellerId = product.getSeller().getId();
        this.sellerNickname = sellerNickname;
        this.name = product.getName();
        this.category = product.getCategory().getLabel();
        this.price = product.getPrice();
        this.unit = product.getUnit();
        this.stock = product.getStock();
        this.imageUrl = product.getImageUrl();
        this.description = product.getDescription();
        this.harvestDate = product.getHarvestDate();
        this.producerName = product.getProducerName();
        this.productionLocation = product.getProductionLocation();
        this.address = product.getAddress();
        this.latitude = product.getLatitude();
        this.longitude = product.getLongitude();
        this.spaceId = product.getSpaceId();
        this.foodMileageKm = product.getFoodMileageKm();
        this.status = product.getStatus().name();
        this.freshnessTags = freshnessTags;
        this.createdAt = product.getCreatedAt();
        this.traceabilityEvents = events.stream().map(TraceabilityEventResponse::from).toList();
    }

    public static ProductDetailResponse from(Product product, String sellerNickname,
                                             List<String> freshnessTags,
                                             List<ProductTraceabilityEvent> events) {
        return new ProductDetailResponse(product, sellerNickname, freshnessTags, events);
    }
}
