package com.farmbroker.farmbroker.matching.domain;

// 매칭 신청의 상태를 구분하는 enum.
// REQUESTED(신청됨, 초기 상태) → ACCEPTED / REJECTED / CANCELED 로만 전이되며,
// 종료 상태(ACCEPTED/REJECTED/CANCELED)에서 다른 상태로 되돌아갈 수 없다.
// CANCELED는 farmer 본인이 아직 응답받지 않은 신청을 거둬들일 때 쓴다(PATCH /matchings/{id}/cancel).
public enum MatchingStatus {
    REQUESTED,
    ACCEPTED,
    REJECTED,
    CANCELED
}
