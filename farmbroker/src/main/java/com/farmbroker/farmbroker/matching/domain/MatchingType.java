package com.farmbroker.farmbroker.matching.domain;

// 농부가 공간을 어떤 목적으로 쓰려는지 구분하는 신청 유형.
// 공간 소유자가 수락 여부를 판단할 때 메시지만으로는 알 수 없는 정보라 별도 항목으로 받는다.
// PROFIT(수익) — 판매·납품을 목표로 하는 재배, HOBBY(취미) — 자가 소비 목적의 재배.
public enum MatchingType {
    PROFIT,
    HOBBY
}
