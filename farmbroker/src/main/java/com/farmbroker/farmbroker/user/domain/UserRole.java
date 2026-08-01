package com.farmbroker.farmbroker.user.domain;

// User가 플랫폼에서 맡는 역할을 구분하는 enum.
// OWNER: 공실 제공자 / FARMER: 도심 농부 / CONSUMER: 지역 소비자.
// DB에 문자열로 저장(@Enumerated(STRING))해 가독성을 높이고,
// 다른 팀원의 권한 로직(예: OWNER만 공간 등록 가능)에서 이 타입을 그대로 참조한다.
public enum UserRole {
    OWNER,
    FARMER,
    CONSUMER
}
