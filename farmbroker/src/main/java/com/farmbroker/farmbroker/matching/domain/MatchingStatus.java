package com.farmbroker.farmbroker.matching.domain;

// 매칭 신청의 상태를 구분하는 enum. 계약서의 진행 상태도 이 값 하나로 나타낸다 —
// 별도의 계약 상태를 두면 둘이 어긋날 여지만 생긴다.
// REQUESTED(신청됨, 초기 상태 = 채팅 협의·계약서 작성·동의 대기) →
// ACCEPTED(양측 동의로 최종 계약) / REJECTED(한쪽이 계약 취소) / CANCELED(신청자 본인 철회)
// 로만 전이되며, 종료 상태에서 다른 상태로 되돌아갈 수 없다.
public enum MatchingStatus {
    REQUESTED,
    ACCEPTED,
    REJECTED,
    CANCELED
}
