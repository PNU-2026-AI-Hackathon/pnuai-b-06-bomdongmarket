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

    @NotBlank(message = "제목은 필수입니다.")
    @Size(max = 100, message = "제목은 100자 이하여야 합니다.")
    private String title;

    @NotBlank(message = "주소는 필수입니다.")
    @Size(max = 255, message = "주소는 255자 이하여야 합니다.")
    private String address;

    @NotNull(message = "면적은 필수입니다.")
    @DecimalMin(value = "0.0", inclusive = false, message = "면적은 0보다 커야 합니다.")
    private BigDecimal area;

    @NotNull(message = "월세는 필수입니다.")
    @Min(value = 0, message = "월세는 0 이상이어야 합니다.")
    private Integer monthlyRent;

    @NotNull(message = "층수는 필수입니다.")
    private Integer floor;

    @NotNull(message = "수도 가능 여부는 필수입니다.")
    private Boolean hasWater;

    @NotNull(message = "전기 가능 여부는 필수입니다.")
    private Boolean hasElectricity;

    @NotNull(message = "환기 가능 여부는 필수입니다.")
    private Boolean hasVentilation;

    private String description;

    // 배열 순서 = 노출 순서 (0번이 대표 이미지). 미입력 시 이미지 없이 등록
    private List<@NotBlank(message = "이미지 URL은 비어 있을 수 없습니다.") @Size(max = 500) String> imageUrls;
}
