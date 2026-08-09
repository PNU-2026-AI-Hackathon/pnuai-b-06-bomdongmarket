package com.farmbroker.farmbroker.common.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

// null이면 통과(제약 없음), 값이 있으면 공백만으로 이뤄질 수 없다. String.isBlank()로 빈 문자열·공백 문자열을 함께 거른다.
public class NullOrNotBlankValidator implements ConstraintValidator<NullOrNotBlank, String> {

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        return value == null || !value.isBlank();
    }
}
