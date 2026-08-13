package com.farmbroker.farmbroker.common.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

// null은 허용하되(주로 PATCH 부분수정에서 null=변경 없음), 값이 있으면 빈 문자열/공백만으로 이뤄질 수 없게 한다.
// @NotBlank는 null도 거부해 부분수정 필드에는 쓸 수 없고, @Size(max)는 길이만 볼 뿐 빈/공백을 막지 못한다 — 그 사이를 메운다.
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Constraint(validatedBy = NullOrNotBlankValidator.class)
public @interface NullOrNotBlank {

    String message() default "값이 있으면 공백일 수 없습니다.";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
