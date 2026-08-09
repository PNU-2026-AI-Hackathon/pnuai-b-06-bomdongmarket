package com.farmbroker.farmbroker.product.dto;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

// 상품 요청 DTO의 문자열 검증 계약을 고정한다.
// 부분수정(PATCH)에서 null은 '변경 없음'으로 통과하되, 값이 있으면 빈/공백 문자열은 막아야 한다(@NullOrNotBlank).
class ProductRequestValidationTest {

    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());
    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    private ProductUpdateRequest update(String json) throws Exception {
        return objectMapper.readValue(json, ProductUpdateRequest.class);
    }

    private ProductCreateRequest create(String json) throws Exception {
        return objectMapper.readValue(json, ProductCreateRequest.class);
    }

    @Test
    void update_allows_null_strings_as_no_change() throws Exception {
        // 값이 아예 없으면(부분수정) 문자열 제약은 통과해야 한다.
        assertThat(validator.validate(update("{ \"price\": 5000 }"))).isEmpty();
    }

    @Test
    void update_rejects_empty_name() throws Exception {
        assertThat(validator.validate(update("{ \"name\": \"\" }")))
                .extracting(violation -> violation.getPropertyPath().toString())
                .contains("name");
    }

    @Test
    void update_rejects_blank_name() throws Exception {
        assertThat(validator.validate(update("{ \"name\": \"   \" }")))
                .extracting(violation -> violation.getPropertyPath().toString())
                .contains("name");
    }

    @Test
    void update_rejects_blank_unit_and_production_location() throws Exception {
        assertThat(validator.validate(update("{ \"unit\": \" \", \"productionLocation\": \"\" }")))
                .extracting(violation -> violation.getPropertyPath().toString())
                .contains("unit", "productionLocation");
    }

    @Test
    void update_accepts_non_blank_value() throws Exception {
        assertThat(validator.validate(update("{ \"name\": \"버터헤드 상추\" }"))).isEmpty();
    }

    @Test
    void create_rejects_blank_image_url() throws Exception {
        // 선택 필드라도 값을 보낼 때 공백은 허용하지 않는다(생략은 가능).
        assertThat(validator.validate(create("""
                {
                  "name": "버터헤드 상추",
                  "category": "잎채소",
                  "price": 4300,
                  "unit": "팩",
                  "stock": 24,
                  "harvestDate": "2026-07-05",
                  "productionLocation": "장전 스마트팜",
                  "imageUrl": "   "
                }
                """)))
                .extracting(violation -> violation.getPropertyPath().toString())
                .contains("imageUrl");
    }
}
