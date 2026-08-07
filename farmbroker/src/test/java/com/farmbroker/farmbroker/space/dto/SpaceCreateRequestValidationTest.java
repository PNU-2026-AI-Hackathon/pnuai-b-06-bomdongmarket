package com.farmbroker.farmbroker.space.dto;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;

import java.util.stream.Collectors;
import java.util.stream.IntStream;

import static org.assertj.core.api.Assertions.assertThat;

// 도면은 필수, 공간 사진은 선택이라는 등록 규칙을 요청 DTO 검증으로 고정한다.
class SpaceCreateRequestValidationTest {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    private SpaceCreateRequest numbers(String area, String monthlyRent, String floor)
            throws Exception {
        return objectMapper.readValue(
                """
                {
                  "title": "부산대 앞 20평 상가 공실",
                  "address": "부산광역시 금정구 장전동",
                  "area": %s,
                  "monthlyRent": %s,
                  "floor": %s,
                  "hasWater": true,
                  "hasElectricity": true,
                  "hasVentilation": true,
                  "floorPlanUrls": ["http://localhost:8080/api/files/%032d.jpg"]
                }
                """.formatted(area, monthlyRent, floor, 1),
                SpaceCreateRequest.class);
    }

    private SpaceCreateRequest request(String imageUrls, String floorPlanUrls) throws Exception {
        return objectMapper.readValue(
                """
                {
                  "title": "부산대 앞 20평 상가 공실",
                  "address": "부산광역시 금정구 장전동",
                  "area": 66,
                  "monthlyRent": 500000,
                  "floor": 2,
                  "hasWater": true,
                  "hasElectricity": true,
                  "hasVentilation": true,
                  "description": "설명",
                  "imageUrls": %s,
                  "floorPlanUrls": %s
                }
                """.formatted(imageUrls, floorPlanUrls),
                SpaceCreateRequest.class);
    }

    private static String urls(int count) {
        return IntStream.range(0, count)
                .mapToObj(index -> "\"http://localhost:8080/api/files/%032d.jpg\"".formatted(index))
                .collect(Collectors.joining(",", "[", "]"));
    }

    @Test
    void accepts_floor_plan_without_photos() throws Exception {
        assertThat(validator.validate(request("[]", urls(1)))).isEmpty();
    }

    @Test
    void accepts_photos_and_floor_plans_up_to_ten() throws Exception {
        assertThat(validator.validate(request(urls(10), urls(10)))).isEmpty();
    }

    @Test
    void rejects_missing_floor_plan() throws Exception {
        assertThat(validator.validate(request(urls(3), "[]")))
                .extracting(violation -> violation.getPropertyPath().toString())
                .contains("floorPlanUrls");
    }

    @Test
    void rejects_null_floor_plan() throws Exception {
        assertThat(validator.validate(request(urls(3), "null")))
                .extracting(violation -> violation.getPropertyPath().toString())
                .contains("floorPlanUrls");
    }

    // ── 숫자 필드 ──────────────────────────────────────────────────────────

    @Test
    void rejects_negative_area_and_rent() throws Exception {
        assertThat(validator.validate(numbers("-1", "500000", "2")))
                .extracting(violation -> violation.getPropertyPath().toString())
                .contains("area");
        assertThat(validator.validate(numbers("66", "-1", "2")))
                .extracting(violation -> violation.getPropertyPath().toString())
                .contains("monthlyRent");
    }

    @Test
    void rejects_zero_area_but_allows_zero_rent() throws Exception {
        assertThat(validator.validate(numbers("0", "500000", "2")))
                .extracting(violation -> violation.getPropertyPath().toString())
                .contains("area");
        // 무상 제공(월세 0원)은 허용한다.
        assertThat(validator.validate(numbers("66", "0", "2"))).isEmpty();
    }

    // 지하 공간은 층수가 음수로 들어온다(mock의 '서면 지하 재배 공간'이 -1). 막으면 안 된다.
    @Test
    void allows_basement_floor() throws Exception {
        assertThat(validator.validate(numbers("42", "350000", "-1"))).isEmpty();
        assertThat(validator.validate(numbers("42", "350000", "-10"))).isEmpty();
    }

    @Test
    void rejects_out_of_range_floor() throws Exception {
        assertThat(validator.validate(numbers("66", "500000", "-11")))
                .extracting(violation -> violation.getPropertyPath().toString())
                .contains("floor");
        assertThat(validator.validate(numbers("66", "500000", "201")))
                .extracting(violation -> violation.getPropertyPath().toString())
                .contains("floor");
    }

    // area 컬럼이 precision 7 / scale 2라 이보다 크면 DB에서 터진다. 검증에서 먼저 걸러야 한다.
    @Test
    void rejects_area_over_column_precision() throws Exception {
        assertThat(validator.validate(numbers("100000", "500000", "2")))
                .extracting(violation -> violation.getPropertyPath().toString())
                .contains("area");
    }

    @Test
    void rejects_more_than_ten_images() throws Exception {
        assertThat(validator.validate(request(urls(11), urls(1))))
                .extracting(violation -> violation.getPropertyPath().toString())
                .contains("imageUrls");
        assertThat(validator.validate(request(urls(1), urls(11))))
                .extracting(violation -> violation.getPropertyPath().toString())
                .contains("floorPlanUrls");
    }
}
