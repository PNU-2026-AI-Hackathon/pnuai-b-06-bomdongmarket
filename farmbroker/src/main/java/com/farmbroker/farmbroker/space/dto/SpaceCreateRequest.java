package com.farmbroker.farmbroker.space.dto;

import io.swagger.v3.oas.annotations.media.Schema;
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
    // spaces.area는 precision 7 / scale 2라 이 값을 넘으면 DB 저장 단계에서 터진다. 검증으로 먼저 막는다.
    private static final String AREA_MAX = "99999.99";
    private static final long RENT_MIN = 0;
    // 층수는 지하가 음수(-1, -2 …)로 들어오므로 음수를 막지 않고 상식적인 범위만 제한한다.
    private static final int FLOOR_MIN = -10;
    private static final int FLOOR_MAX = 200;
    private static final int IMAGE_URL_MAX_LENGTH = 500;
    private static final int IMAGE_MAX_COUNT = 10;
    private static final int FLOOR_PLAN_MIN_COUNT = 1;

    // 검증 메시지 상수
    private static final String MSG_TITLE_REQUIRED = "제목은 필수입니다.";
    private static final String MSG_TITLE_SIZE = "제목은 100자 이하여야 합니다.";
    private static final String MSG_ADDRESS_REQUIRED = "주소는 필수입니다.";
    private static final String MSG_ADDRESS_SIZE = "주소는 255자 이하여야 합니다.";
    private static final String MSG_AREA_REQUIRED = "면적은 필수입니다.";
    private static final String MSG_AREA_POSITIVE = "면적은 0보다 커야 합니다.";
    private static final String MSG_AREA_MAX = "면적은 99,999.99㎡ 이하여야 합니다.";
    private static final String MSG_FLOOR_RANGE = "층수는 -10층(지하) ~ 200층 사이여야 합니다.";
    private static final String MSG_RENT_REQUIRED = "월세는 필수입니다.";
    private static final String MSG_RENT_MIN = "월세는 0 이상이어야 합니다.";
    private static final String MSG_FLOOR_REQUIRED = "층수는 필수입니다.";
    private static final String MSG_WATER_REQUIRED = "수도 가능 여부는 필수입니다.";
    private static final String MSG_ELECTRICITY_REQUIRED = "전기 가능 여부는 필수입니다.";
    private static final String MSG_VENTILATION_REQUIRED = "환기 가능 여부는 필수입니다.";
    private static final String MSG_IMAGE_URL_BLANK = "이미지 URL은 비어 있을 수 없습니다.";
    private static final String MSG_IMAGE_COUNT = "이미지는 10장까지 등록할 수 있습니다.";
    private static final String MSG_FLOOR_PLAN_REQUIRED = "도면은 최소 1장 등록해야 합니다.";
    private static final String MSG_FLOOR_PLAN_COUNT = "도면은 1~10장까지 등록할 수 있습니다.";

    @NotBlank(message = MSG_TITLE_REQUIRED)
    @Size(max = TITLE_MAX_LENGTH, message = MSG_TITLE_SIZE)
    private String title;

    @NotBlank(message = MSG_ADDRESS_REQUIRED)
    @Size(max = ADDRESS_MAX_LENGTH, message = MSG_ADDRESS_SIZE)
    private String address;

    @NotNull(message = MSG_AREA_REQUIRED)
    @DecimalMin(value = AREA_MIN_EXCLUSIVE, inclusive = false, message = MSG_AREA_POSITIVE)
    @DecimalMax(value = AREA_MAX, message = MSG_AREA_MAX)
    private BigDecimal area;

    @NotNull(message = MSG_RENT_REQUIRED)
    @Min(value = RENT_MIN, message = MSG_RENT_MIN)
    private Integer monthlyRent;

    @NotNull(message = MSG_FLOOR_REQUIRED)
    @Min(value = FLOOR_MIN, message = MSG_FLOOR_RANGE)
    @Max(value = FLOOR_MAX, message = MSG_FLOOR_RANGE)
    private Integer floor;

    @NotNull(message = MSG_WATER_REQUIRED)
    private Boolean hasWater;

    @NotNull(message = MSG_ELECTRICITY_REQUIRED)
    private Boolean hasElectricity;

    @NotNull(message = MSG_VENTILATION_REQUIRED)
    private Boolean hasVentilation;

    private String description;

    // 지도용 좌표(선택). 프론트가 주소를 지오코딩해 보낸다. 실패 시 null 허용.
    @DecimalMin(value = "-90.0", message = "위도는 -90~90 사이여야 합니다.")
    @DecimalMax(value = "90.0", message = "위도는 -90~90 사이여야 합니다.")
    private Double latitude;

    @DecimalMin(value = "-180.0", message = "경도는 -180~180 사이여야 합니다.")
    @DecimalMax(value = "180.0", message = "경도는 -180~180 사이여야 합니다.")
    private Double longitude;

    // 배열 순서 = 노출 순서 (0번이 대표 이미지). 미입력 시 이미지 없이 등록
    @Schema(description = """
            공간 사진 URL 배열. 선택 항목이며 최대 10장.
            배열 순서가 노출 순서이고 0번이 목록 카드의 대표 이미지가 된다.
            POST /files로 업로드한 뒤 응답의 url을 그대로 넣는다.""",
            requiredMode = Schema.RequiredMode.NOT_REQUIRED)
    @Size(max = IMAGE_MAX_COUNT, message = MSG_IMAGE_COUNT)
    private List<@NotBlank(message = MSG_IMAGE_URL_BLANK) @Size(max = IMAGE_URL_MAX_LENGTH) String> imageUrls;

    // 공간 사진과 달리 도면은 필수다 — 재배 모듈 배치를 검토하려면 반드시 있어야 한다.
    @Schema(description = """
            도면 URL 배열. 재배 모듈 배치 검토에 필요하므로 최소 1장이 필수이며 최대 10장.
            공간 사진과 별도로 저장되고(space_floor_plans) 목록 카드 썸네일에는 쓰이지 않는다.
            POST /files로 업로드한 뒤 응답의 url을 그대로 넣는다.""",
            requiredMode = Schema.RequiredMode.REQUIRED)
    @NotEmpty(message = MSG_FLOOR_PLAN_REQUIRED)
    @Size(min = FLOOR_PLAN_MIN_COUNT, max = IMAGE_MAX_COUNT, message = MSG_FLOOR_PLAN_COUNT)
    private List<@NotBlank(message = MSG_IMAGE_URL_BLANK) @Size(max = IMAGE_URL_MAX_LENGTH) String> floorPlanUrls;
}
