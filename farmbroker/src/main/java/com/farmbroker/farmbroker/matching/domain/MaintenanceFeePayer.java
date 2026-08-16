package com.farmbroker.farmbroker.matching.domain;

// 관리비를 누가 내는지. 계약 당사자는 둘뿐이라 값도 둘뿐이고,
// 화면에서는 이 값 대신 해당 당사자의 닉네임을 보여준다(ContractResponse의 viewerRole과 같은 표기).
public enum MaintenanceFeePayer {

    // 공간 제공자
    OWNER,

    // 도심 농부
    FARMER
}
