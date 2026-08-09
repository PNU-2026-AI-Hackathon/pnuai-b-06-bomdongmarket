package com.farmbroker.farmbroker.auth.dto;

import com.fasterxml.jackson.databind.DeserializationFeature;
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

    // 가입 시 직업 선택을 없앤 뒤에도 구버전 클라이언트가 role을 계속 보낼 수 있다.
    // Spring Boot 기본 ObjectMapper는 FAIL_ON_UNKNOWN_PROPERTIES가 꺼져 있으므로
    // 같은 설정에서 role이 조용히 무시되고 나머지 필드는 정상 바인딩되는지 확인한다.
    @Test
    void ignoresLegacyRoleField() throws Exception {
        ObjectMapper lenientMapper = new ObjectMapper()
                .disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES);

        SignupRequest request = lenientMapper.readValue(
                """
                {
                  "email": "farmer@example.com",
                  "password": "12345678",
                  "nickname": "도시농부",
                  "role": "OWNER"
                }
                """,
                SignupRequest.class
        );

        assertThat(validator.validate(request)).isEmpty();
        assertThat(request.getNickname()).isEqualTo("도시농부");
    }

    private SignupRequest requestWithNickname(String nickname) throws Exception {
        return objectMapper.readValue(
                """
                {
                  "email": "farmer@example.com",
                  "password": "12345678",
                  "nickname": "%s"
                }
                """.formatted(nickname),
                SignupRequest.class
        );
    }
}
