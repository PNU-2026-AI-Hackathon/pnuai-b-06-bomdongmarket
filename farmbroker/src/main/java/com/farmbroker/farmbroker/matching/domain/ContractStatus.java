package com.farmbroker.farmbroker.matching.domain;

// 계약서 한 건의 진행 상태. 컬럼으로 저장하지 않고 동의·취소 시각에서 매번 유도한다
// (Matching.getContractStatus) — 시각과 상태를 따로 들면 둘이 어긋날 여지가 생긴다.
public enum ContractStatus {

    // 조건을 입력·수정하고 동의할 수 있는 상태. 아직 한쪽만 동의했거나 아무도 동의하지 않았다.
    DRAFT,

    // 양측이 모두 동의해 확정된 상태. 조건 수정과 추가 동의를 막는다.
    CONFIRMED,

    // 한쪽이라도 취소한 상태. 되돌릴 수 없다.
    CANCELED
}
