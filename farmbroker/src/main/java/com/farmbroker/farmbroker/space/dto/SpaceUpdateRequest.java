package com.farmbroker.farmbroker.space.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

// 공간 부분수정(PATCH) 요청 바디. 모든 필드가 선택적이며 null이 아닌 필드만 반영한다.
// 검증 어노테이션은 값이 존재할 때만 동작한다 (null이면 통과 — PATCH 의미론과 일치).
// status는 잘못된 문자열도 INVALID_STATUS_CHANGE로 응답하기 위해 enum이 아닌 String으로 받아 서비스에서 검증한다.
@Getter
@NoArgsConstructor
public class SpaceUpdateRequest {

    @Size(min = 1, max = 100, message = "제목은 1~100자여야 합니다.")
    private String title;

    @Size(min = 1, max = 255, message = "주소는 1~255자여야 합니다.")
    private String address;

    @DecimalMin(value = "0.0", inclusive = false, message = "면적은 0보다 커야 합니다.")
    private BigDecimal area;

    @Min(value = 0, message = "월세는 0 이상이어야 합니다.")
    private Integer monthlyRent;

    private Integer floor;

    private Boolean hasWater;

    private Boolean hasElectricity;

    private Boolean hasVentilation;

    private String description;

    // AVAILABLE / CLOSED만 허용. MATCHED 등 그 외 값은 INVALID_STATUS_CHANGE
    private String status;

    // null = 이미지 변경 없음, 배열 = 전체 교체(빈 배열이면 전부 삭제)
    private List<@NotBlank(message = "이미지 URL은 비어 있을 수 없습니다.") @Size(max = 500) String> imageUrls;
}
