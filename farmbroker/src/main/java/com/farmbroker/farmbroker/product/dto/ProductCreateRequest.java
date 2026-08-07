package com.farmbroker.farmbroker.product.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

// 상품 등록 요청 바디. sellerId는 절대 body로 받지 않는다 — 항상 인증 컨텍스트(@AuthenticationPrincipal)에서 식별.
//
// [프론트 참고] category는 한글 라벨('잎채소'/'허브'/'과채류')로 보낸다.
// [프론트 참고] '작업장에서 가져오기'는 GET /spaces/my 로 내 공간을 고른 뒤
//              productionLocation/address/spaceId 를 채워 보내는 방식이다(백엔드는 spaceId만 스냅샷 보관).
// [프론트 참고] latitude/longitude/foodMileageKm 는 Task 3(지도) 전까지 생략 가능(null 허용).
@Getter
@NoArgsConstructor
public class ProductCreateRequest {

    @NotBlank(message = "상품명은 필수입니다.")
    @Size(max = 100, message = "상품명은 100자 이하여야 합니다.")
    private String name;

    @NotBlank(message = "카테고리는 필수입니다.")
    private String category;

    @NotNull(message = "가격은 필수입니다.")
    @Min(value = 0, message = "가격은 0 이상이어야 합니다.")
    private Integer price;

    @NotBlank(message = "판매 단위는 필수입니다.")
    @Size(max = 20, message = "판매 단위는 20자 이하여야 합니다.")
    private String unit;

    @NotNull(message = "재고는 필수입니다.")
    @Min(value = 0, message = "재고는 0 이상이어야 합니다.")
    private Integer stock;

    @Size(max = 500, message = "이미지 URL은 500자 이하여야 합니다.")
    private String imageUrl;

    private String description;

    @NotNull(message = "수확일은 필수입니다.")
    private LocalDate harvestDate;

    // 미입력 시 판매자 닉네임으로 채운다.
    @Size(max = 60, message = "생산자명은 60자 이하여야 합니다.")
    private String producerName;

    @NotBlank(message = "생산 위치는 필수입니다.")
    @Size(max = 255, message = "생산 위치는 255자 이하여야 합니다.")
    private String productionLocation;

    @Size(max = 255, message = "주소는 255자 이하여야 합니다.")
    private String address;

    private Double latitude;

    private Double longitude;

    // Space에서 가져온 경우 그 공간 id(출처 스냅샷). 직접 입력이면 생략.
    private Long spaceId;

    @PositiveOrZero(message = "푸드 마일리지는 0 이상이어야 합니다.")
    private Double foodMileageKm;

    // 생산 이력 이벤트. 미입력 시 이력 없이 등록.
    @Valid
    private List<TraceabilityEventRequest> events;
}
