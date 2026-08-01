package com.farmbroker.farmbroker.space.domain;

// 공간의 매칭 가능 여부 상태.
// AVAILABLE: 매칭 가능 (등록 직후 기본값)
// MATCHED:   매칭 완료 — matching 도메인(BE3)만 전환 가능. OWNER가 PATCH로 직접 설정 불가
// CLOSED:    노출 중단 — OWNER가 비공개 처리
public enum SpaceStatus {
    AVAILABLE,
    MATCHED,
    CLOSED
}
