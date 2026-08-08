package com.farmbroker.farmbroker.common.exception;

import com.farmbroker.farmbroker.common.response.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.util.stream.Collectors;

// 전역 예외 핸들러. 컨트롤러까지 올라온 예외를 종류별로 잡아
// ApiResponse.error 포맷으로 변환해 반환한다.
// 서비스/컨트롤러에서 별도 try-catch 없이 throw만 해도 일관된 에러 응답이 만들어진다.
@RestControllerAdvice
public class GlobalExceptionHandler {

    // 비즈니스 규칙 위반 (DUPLICATE_EMAIL, INVALID_CREDENTIALS 등)
    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiResponse<Void>> handleBusinessException(BusinessException e) {
        ErrorCode errorCode = e.getErrorCode();
        return ResponseEntity
                .status(errorCode.getStatus())
                .body(ApiResponse.error(e.getMessage(), errorCode.name()));
    }

    // @Valid 검증 실패 — 어떤 필드가 잘못됐는지 메시지에 포함
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidationException(MethodArgumentNotValidException e) {
        String message = e.getBindingResult().getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .collect(Collectors.joining(", "));
        return ResponseEntity
                .status(ErrorCode.VALIDATION_ERROR.getStatus())
                .body(ApiResponse.error(message, ErrorCode.VALIDATION_ERROR.name()));
    }

    // 업로드 용량 초과 — Spring이 컨트롤러 진입 전에 던지므로 여기서 파일 에러로 변환한다.
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ApiResponse<Void>> handleMaxUploadSize(MaxUploadSizeExceededException e) {
        return ResponseEntity
                .status(ErrorCode.FILE_TOO_LARGE.getStatus())
                .body(ApiResponse.error(ErrorCode.FILE_TOO_LARGE.getDefaultMessage(),
                        ErrorCode.FILE_TOO_LARGE.name()));
    }

    // 예상치 못한 서버 오류
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleException(Exception e) {
        return ResponseEntity
                .status(ErrorCode.INTERNAL_ERROR.getStatus())
                .body(ApiResponse.error(ErrorCode.INTERNAL_ERROR.getDefaultMessage(), ErrorCode.INTERNAL_ERROR.name()));
    }
}
