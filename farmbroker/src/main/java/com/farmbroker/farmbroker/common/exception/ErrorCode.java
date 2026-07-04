package com.farmbroker.farmbroker.common.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

// 비즈니스 에러의 종류를 enum으로 중앙 관리.
// HTTP 상태코드 + 기본 메시지를 함께 보유해 GlobalExceptionHandler가
// ErrorCode 하나만 받아도 응답을 완성할 수 있게 한다.
// 다른 팀원은 이 enum에 자신의 도메인 코드를 추가해 확장한다.
@Getter
public enum ErrorCode {

    // ── auth / user ──────────────────────────────────────────────────────────
    DUPLICATE_EMAIL(HttpStatus.CONFLICT, "이미 사용 중인 이메일입니다."),
    INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED, "이메일 또는 비밀번호가 올바르지 않습니다."),
    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다."),
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "인증이 필요합니다."),

    // ── 공통 ─────────────────────────────────────────────────────────────────
    VALIDATION_ERROR(HttpStatus.BAD_REQUEST, "요청 값이 올바르지 않습니다."),
    INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "서버 내부 오류가 발생했습니다.");

    private final HttpStatus status;
    private final String defaultMessage;

    ErrorCode(HttpStatus status, String defaultMessage) {
        this.status = status;
        this.defaultMessage = defaultMessage;
    }
}
