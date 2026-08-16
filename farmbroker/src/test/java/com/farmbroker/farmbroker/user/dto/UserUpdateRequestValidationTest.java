package com.farmbroker.farmbroker.user.dto;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;

import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;

class UserUpdateRequestValidationTest {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @ParameterizedTest
    @MethodSource("validNicknameLengths")
    void uses_the_same_nickname_length_contract_as_signup(String nickname) throws Exception {
        UserUpdateRequest request = objectMapper.readValue("""
                {"nickname":"%s","currentPassword":"current-password","newPassword":"new-password"}
                """.formatted(nickname), UserUpdateRequest.class);

        assertThat(validator.validate(request))
                .extracting(violation -> violation.getPropertyPath().toString())
                .doesNotContain("nickname");
    }

    private static Stream<String> validNicknameLengths() {
        return Stream.of("농부", "가".repeat(30));
    }

    @ParameterizedTest
    @MethodSource("invalidNicknameLengths")
    void rejects_nickname_lengths_outside_the_signup_contract(String nickname) throws Exception {
        UserUpdateRequest request = objectMapper.readValue("""
                {"nickname":"%s"}
                """.formatted(nickname), UserUpdateRequest.class);

        assertThat(validator.validate(request))
                .extracting(violation -> violation.getPropertyPath().toString())
                .contains("nickname");
    }

    private static Stream<String> invalidNicknameLengths() {
        return Stream.of("농", "가".repeat(31));
    }

    @ParameterizedTest
    @MethodSource("incompletePasswordChanges")
    void rejects_incomplete_password_change(String currentPassword, String newPassword) throws Exception {
        UserUpdateRequest request = objectMapper.readValue("""
                {"nickname":"닉네임","currentPassword":%s,"newPassword":%s}
                """.formatted(json(currentPassword), json(newPassword)), UserUpdateRequest.class);

        assertThat(validator.validate(request))
                .extracting(violation -> violation.getMessage())
                .contains("비밀번호 변경 시 현재 비밀번호와 새 비밀번호를 함께 입력해야 합니다.");
    }

    private static Stream<org.junit.jupiter.params.provider.Arguments> incompletePasswordChanges() {
        return Stream.of(
                org.junit.jupiter.params.provider.Arguments.of("current-password", null),
                org.junit.jupiter.params.provider.Arguments.of(null, "new-password"));
    }

    private String json(String value) {
        return value == null ? "null" : "\"" + value + "\"";
    }
}
