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

    // ── space ────────────────────────────────────────────────────────────────
    SPACE_NOT_FOUND(HttpStatus.NOT_FOUND, "공간을 찾을 수 없습니다."),
    SPACE_NOT_AVAILABLE(HttpStatus.CONFLICT, "현재 매칭 가능한 상태의 공간이 아닙니다."),
    NOT_SPACE_OWNER(HttpStatus.FORBIDDEN, "본인 소유 공간이 아닙니다."),
    FORBIDDEN_ROLE(HttpStatus.FORBIDDEN, "권한이 없는 역할입니다."),
    INVALID_STATUS_CHANGE(HttpStatus.BAD_REQUEST, "허용되지 않는 상태 변경입니다."),

    // ── 공통 ─────────────────────────────────────────────────────────────────
    VALIDATION_ERROR(HttpStatus.BAD_REQUEST, "요청 값이 올바르지 않습니다."),
    INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "서버 내부 오류가 발생했습니다."),

    // ── matching (소유: 백엔드 3) ─────────────────────────────────────────────
    MATCHING_NOT_FOUND(HttpStatus.NOT_FOUND, "존재하지 않는 매칭 신청입니다."),
    MATCHING_FORBIDDEN(HttpStatus.FORBIDDEN, "해당 매칭에 대한 권한이 없습니다."),
    MATCHING_ALREADY_PROCESSED(HttpStatus.CONFLICT, "이미 처리된 매칭 신청입니다."),
    MATCHING_DUPLICATED(HttpStatus.CONFLICT, "이미 신청한 공간입니다."),
    MATCHING_SELF_APPLY(HttpStatus.BAD_REQUEST, "본인 소유 공간에는 신청할 수 없습니다."),

    // ── ai (소유: 백엔드 3) ──────────────────────────────────────────────────
    AI_TIMEOUT(HttpStatus.GATEWAY_TIMEOUT, "AI 응답 시간이 초과되었습니다."),
    AI_RESPONSE_INVALID(HttpStatus.BAD_GATEWAY, "AI 응답 처리에 실패했습니다."),
    AI_QUOTA_EXCEEDED(HttpStatus.TOO_MANY_REQUESTS, "AI 요청 한도를 초과했습니다."),

    // ── crop (소유: 백엔드 3) ────────────────────────────────────────────────
    CROP_NOT_FOUND(HttpStatus.NOT_FOUND, "존재하지 않는 작물입니다.");

    private final HttpStatus status;
    private final String defaultMessage;

    ErrorCode(HttpStatus status, String defaultMessage) {
        this.status = status;
        this.defaultMessage = defaultMessage;
    }
}
