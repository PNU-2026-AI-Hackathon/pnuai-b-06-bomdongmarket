package com.farmbroker.farmbroker.space.dto;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

// 공간 등록 요청 바디. ownerId는 절대 body로 받지 않는다 — 항상 인증 컨텍스트(@AuthenticationPrincipal)에서 식별.
@Getter
@NoArgsConstructor
public class SpaceCreateRequest {

    // 검증 제약값 상수 — 어노테이션 속성은 컴파일 타임 상수만 허용되므로 static final로 관리한다
    private static final int TITLE_MAX_LENGTH = 100;
    private static final int ADDRESS_MAX_LENGTH = 255;
    private static final String AREA_MIN_EXCLUSIVE = "0.0";
    private static final long RENT_MIN = 0;
    private static final int IMAGE_URL_MAX_LENGTH = 500;

    // 검증 메시지 상수
    private static final String MSG_TITLE_REQUIRED = "제목은 필수입니다.";
    private static final String MSG_TITLE_SIZE = "제목은 100자 이하여야 합니다.";
    private static final String MSG_ADDRESS_REQUIRED = "주소는 필수입니다.";
    private static final String MSG_ADDRESS_SIZE = "주소는 255자 이하여야 합니다.";
    private static final String MSG_AREA_REQUIRED = "면적은 필수입니다.";
    private static final String MSG_AREA_POSITIVE = "면적은 0보다 커야 합니다.";
    private static final String MSG_RENT_REQUIRED = "월세는 필수입니다.";
    private static final String MSG_RENT_MIN = "월세는 0 이상이어야 합니다.";
    private static final String MSG_FLOOR_REQUIRED = "층수는 필수입니다.";
    private static final String MSG_WATER_REQUIRED = "수도 가능 여부는 필수입니다.";
    private static final String MSG_ELECTRICITY_REQUIRED = "전기 가능 여부는 필수입니다.";
    private static final String MSG_VENTILATION_REQUIRED = "환기 가능 여부는 필수입니다.";
    private static final String MSG_IMAGE_URL_BLANK = "이미지 URL은 비어 있을 수 없습니다.";

    @NotBlank(message = MSG_TITLE_REQUIRED)
    @Size(max = TITLE_MAX_LENGTH, message = MSG_TITLE_SIZE)
    private String title;

    @NotBlank(message = MSG_ADDRESS_REQUIRED)
    @Size(max = ADDRESS_MAX_LENGTH, message = MSG_ADDRESS_SIZE)
    private String address;

    @NotNull(message = MSG_AREA_REQUIRED)
    @DecimalMin(value = AREA_MIN_EXCLUSIVE, inclusive = false, message = MSG_AREA_POSITIVE)
    private BigDecimal area;

    @NotNull(message = MSG_RENT_REQUIRED)
    @Min(value = RENT_MIN, message = MSG_RENT_MIN)
    private Integer monthlyRent;

    @NotNull(message = MSG_FLOOR_REQUIRED)
    private Integer floor;

    @NotNull(message = MSG_WATER_REQUIRED)
    private Boolean hasWater;

    @NotNull(message = MSG_ELECTRICITY_REQUIRED)
    private Boolean hasElectricity;

    @NotNull(message = MSG_VENTILATION_REQUIRED)
    private Boolean hasVentilation;

    private String description;

    // 배열 순서 = 노출 순서 (0번이 대표 이미지). 미입력 시 이미지 없이 등록
    private List<@NotBlank(message = MSG_IMAGE_URL_BLANK) @Size(max = IMAGE_URL_MAX_LENGTH) String> imageUrls;
}
