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
    INVALID_CURRENT_PASSWORD(HttpStatus.BAD_REQUEST, "현재 비밀번호가 올바르지 않습니다."),
    ACTIVE_CONTRACT_EXISTS(HttpStatus.CONFLICT, "진행 중인 계약이 있어 회원 탈퇴할 수 없습니다."),

    // ── space ────────────────────────────────────────────────────────────────
    SPACE_NOT_FOUND(HttpStatus.NOT_FOUND, "공간을 찾을 수 없습니다."),
    SPACE_NOT_AVAILABLE(HttpStatus.CONFLICT, "현재 매칭 가능한 상태의 공간이 아닙니다."),
    NOT_SPACE_OWNER(HttpStatus.FORBIDDEN, "본인 소유 공간이 아닙니다."),
    FORBIDDEN_ROLE(HttpStatus.FORBIDDEN, "권한이 없는 역할입니다."),
    INVALID_STATUS_CHANGE(HttpStatus.BAD_REQUEST, "허용되지 않는 상태 변경입니다."),

    // ── file ─────────────────────────────────────────────────────────────────
    FILE_EMPTY(HttpStatus.BAD_REQUEST, "업로드할 파일이 없습니다."),
    FILE_TYPE_NOT_SUPPORTED(HttpStatus.BAD_REQUEST, "jpg, png, webp, gif 이미지만 업로드할 수 있습니다."),
    FILE_COUNT_EXCEEDED(HttpStatus.BAD_REQUEST, "이미지는 한 번에 10장까지 업로드할 수 있습니다."),
    FILE_TOO_LARGE(HttpStatus.PAYLOAD_TOO_LARGE, "이미지 한 장의 크기는 5MB 이하여야 합니다."),
    FILE_NOT_FOUND(HttpStatus.NOT_FOUND, "요청한 파일을 찾을 수 없습니다."),
    FILE_FORBIDDEN(HttpStatus.FORBIDDEN, "본인이 업로드한 파일이 아닙니다."),
    FILE_STORAGE_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "파일을 저장하지 못했습니다."),

    // ── 공통 ─────────────────────────────────────────────────────────────────
    VALIDATION_ERROR(HttpStatus.BAD_REQUEST, "요청 값이 올바르지 않습니다."),
    INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "서버 내부 오류가 발생했습니다."),

    // ── matching (소유: 백엔드 3) ─────────────────────────────────────────────
    MATCHING_NOT_FOUND(HttpStatus.NOT_FOUND, "존재하지 않는 매칭 신청입니다."),
    MATCHING_FORBIDDEN(HttpStatus.FORBIDDEN, "해당 매칭에 대한 권한이 없습니다."),
    MATCHING_ALREADY_PROCESSED(HttpStatus.CONFLICT, "이미 처리된 매칭 신청입니다."),
    MATCHING_NOT_PROCESSED(HttpStatus.CONFLICT, "아직 응답하지 않은 매칭 신청입니다."),
    MATCHING_DUPLICATED(HttpStatus.CONFLICT, "이미 신청한 공간입니다."),
    MATCHING_SELF_APPLY(HttpStatus.BAD_REQUEST, "본인 소유 공간에는 신청할 수 없습니다."),

    // ── contract (매칭 1건에 붙는 계약서) ────────────────────────────────────
    CONTRACT_CLOSED(HttpStatus.CONFLICT, "이미 확정되었거나 취소된 계약입니다."),
    CONTRACT_TERMS_CHANGED(HttpStatus.CONFLICT, "계약 조건이 변경되었습니다. 다시 확인해 주세요."),
    CONTRACT_TERMS_REQUIRED(HttpStatus.BAD_REQUEST, "월세와 계약기간을 먼저 입력해야 합니다."),
    CONTRACT_INVALID_PERIOD(HttpStatus.BAD_REQUEST, "계약 종료일은 시작일보다 뒤여야 합니다."),

    // ── ai (소유: 백엔드 3) ──────────────────────────────────────────────────
    AI_TIMEOUT(HttpStatus.GATEWAY_TIMEOUT, "AI 응답 시간이 초과되었습니다."),
    AI_RESPONSE_INVALID(HttpStatus.BAD_GATEWAY, "AI 응답 처리에 실패했습니다."),
    AI_QUOTA_EXCEEDED(HttpStatus.TOO_MANY_REQUESTS, "AI 요청 한도를 초과했습니다."),

    // ── crop (소유: 백엔드 3) ────────────────────────────────────────────────
    CROP_NOT_FOUND(HttpStatus.NOT_FOUND, "존재하지 않는 작물입니다."),

    // ── product (로컬마켓) ───────────────────────────────────────────────────
    PRODUCT_NOT_FOUND(HttpStatus.NOT_FOUND, "존재하지 않는 상품입니다."),
    NOT_PRODUCT_OWNER(HttpStatus.FORBIDDEN, "본인이 등록한 상품이 아닙니다."),

    // ── 찜·주문 ──────────────────────────────────────────────────────────────
    WISHLIST_ITEM_NOT_FOUND(HttpStatus.NOT_FOUND, "찜하지 않은 상품입니다."),
    PRODUCT_NOT_ON_SALE(HttpStatus.CONFLICT, "판매 중인 상품이 아닙니다."),
    OUT_OF_STOCK(HttpStatus.CONFLICT, "재고가 부족합니다."),

    // ── chat ─────────────────────────────────────────────────────────────────
    CHAT_CONVERSATION_NOT_FOUND(HttpStatus.NOT_FOUND, "채팅방을 찾을 수 없습니다."),
    CHAT_FORBIDDEN(HttpStatus.FORBIDDEN, "해당 채팅방에 접근할 권한이 없습니다."),
    CHAT_SELF_CONVERSATION(HttpStatus.BAD_REQUEST, "본인에게는 채팅을 보낼 수 없습니다."),
    CHAT_BLOCKED(HttpStatus.FORBIDDEN, "차단된 사용자와는 채팅할 수 없습니다."),
    CHAT_MESSAGE_EMPTY(HttpStatus.BAD_REQUEST, "메시지나 이미지를 입력해 주세요."),
    CHAT_MESSAGE_TOO_LONG(HttpStatus.BAD_REQUEST, "메시지는 1,000자 이하로 입력해 주세요."),
    CHAT_BLOCK_SELF(HttpStatus.BAD_REQUEST, "본인은 차단할 수 없습니다.");

    private final HttpStatus status;
    private final String defaultMessage;

    ErrorCode(HttpStatus status, String defaultMessage) {
        this.status = status;
        this.defaultMessage = defaultMessage;
    }
}
