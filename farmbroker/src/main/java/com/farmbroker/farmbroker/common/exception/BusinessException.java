package com.farmbroker.farmbroker.common.exception;

import lombok.Getter;

// 비즈니스 규칙 위반 시 던지는 커스텀 예외.
// ErrorCode를 감싸서 서비스 레이어가 throw new BusinessException(ErrorCode.DUPLICATE_EMAIL)
// 한 줄로 에러를 표현하고, GlobalExceptionHandler가 이를 일괄 처리한다.
@Getter
public class BusinessException extends RuntimeException {

    private final ErrorCode errorCode;

    public BusinessException(ErrorCode errorCode) {
        super(errorCode.getDefaultMessage());
        this.errorCode = errorCode;
    }

    public BusinessException(ErrorCode errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }
}
