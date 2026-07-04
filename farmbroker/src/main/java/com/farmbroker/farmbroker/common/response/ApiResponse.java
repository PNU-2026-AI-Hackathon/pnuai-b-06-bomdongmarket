package com.farmbroker.farmbroker.common.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Getter;

// 모든 API 응답을 동일한 구조로 감싸는 래퍼 클래스.
// 컨트롤러가 raw DTO를 직접 반환하지 않고 항상 이 타입으로 반환하도록 강제해
// 프론트가 success/message/data 필드를 일관되게 파싱할 수 있게 한다.
@Getter
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

    private final boolean success;
    private final String message;
    private final T data;
    private final String errorCode;

    private ApiResponse(boolean success, String message, T data, String errorCode) {
        this.success = success;
        this.message = message;
        this.data = data;
        this.errorCode = errorCode;
    }

    public static <T> ApiResponse<T> success(String message, T data) {
        return new ApiResponse<>(true, message, data, null);
    }

    public static <T> ApiResponse<T> error(String message, String errorCode) {
        return new ApiResponse<>(false, message, null, errorCode);
    }
}
