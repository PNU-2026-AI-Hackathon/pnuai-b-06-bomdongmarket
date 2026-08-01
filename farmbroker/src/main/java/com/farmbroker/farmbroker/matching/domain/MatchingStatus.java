package com.farmbroker.farmbroker.matching.domain;

// 매칭 신청의 상태를 구분하는 enum.
// REQUESTED(신청됨, 초기 상태) → ACCEPTED / REJECTED / CANCELED 로만 전이되며,
// 종료 상태(ACCEPTED/REJECTED/CANCELED)에서 다른 상태로 되돌아갈 수 없다.
// CANCELED는 farmer 본인 취소용으로 MVP 이후 사용 예정.
public enum MatchingStatus {
    REQUESTED,
    ACCEPTED,
    REJECTED,
    CANCELED
}
