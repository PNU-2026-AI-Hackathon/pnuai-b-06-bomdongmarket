package com.farmbroker.farmbroker.matching.domain;

// 계약 당사자는 공간 제공자와 도심 농부 둘뿐이다. 계약을 취소한 쪽을 가리키는 데 쓴다.
// MaintenanceFeePayer와 값은 같지만 의미가 다르므로(관리비 부담자 ≠ 취소자) 별도 enum으로 둔다.
public enum ContractParty {

    // 공간 제공자
    OWNER,

    // 도심 농부
    FARMER
}
