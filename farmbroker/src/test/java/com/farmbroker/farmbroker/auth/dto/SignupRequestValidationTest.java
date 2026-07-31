package com.farmbroker.farmbroker.auth.dto;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class SignupRequestValidationTest {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    void acceptsRequiredSignupFields() throws Exception {
        SignupRequest request = requestWithNickname("도시농부");

        assertThat(validator.validate(request)).isEmpty();
    }

    @Test
    void rejectsTooShortNickname() throws Exception {
        SignupRequest request = requestWithNickname("농");

        assertThat(validator.validate(request))
                .extracting(violation -> violation.getPropertyPath().toString())
                .contains("nickname");
    }

    private SignupRequest requestWithNickname(String nickname) throws Exception {
        return objectMapper.readValue(
                """
                {
                  "email": "farmer@example.com",
                  "password": "12345678",
                  "nickname": "%s",
                  "role": "FARMER"
                }
                """.formatted(nickname),
                SignupRequest.class
        );
    }
}
