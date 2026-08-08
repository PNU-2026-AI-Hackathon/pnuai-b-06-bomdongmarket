package com.farmbroker.farmbroker.product.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

// 상품 부분수정 요청 바디. 모든 필드가 optional이며 null이 아닌 값만 반영된다.
// events가 오면 기존 이력을 전량 교체한다(비어 있는 배열이면 이력 전부 삭제).
// status는 'ON_SALE' / 'CLOSED' 문자열.
@Getter
@NoArgsConstructor
public class ProductUpdateRequest {

    @Size(max = 100, message = "상품명은 100자 이하여야 합니다.")
    private String name;

    private String category;

    @Min(value = 0, message = "가격은 0 이상이어야 합니다.")
    private Integer price;

    @Size(max = 20, message = "판매 단위는 20자 이하여야 합니다.")
    private String unit;

    @Min(value = 0, message = "재고는 0 이상이어야 합니다.")
    private Integer stock;

    @Size(max = 500, message = "이미지 URL은 500자 이하여야 합니다.")
    private String imageUrl;

    private String description;

    private LocalDate harvestDate;

    // 생산자명은 수정 대상이 아니다 — 등록 시점 판매자 닉네임으로 고정된다.

    @Size(max = 255, message = "생산 위치는 255자 이하여야 합니다.")
    private String productionLocation;

    @Size(max = 255, message = "주소는 255자 이하여야 합니다.")
    private String address;

    private Double latitude;

    private Double longitude;

    private Long spaceId;

    @PositiveOrZero(message = "푸드 마일리지는 0 이상이어야 합니다.")
    private Double foodMileageKm;

    private String status;

    @Valid
    private List<TraceabilityEventRequest> events;
}
