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
