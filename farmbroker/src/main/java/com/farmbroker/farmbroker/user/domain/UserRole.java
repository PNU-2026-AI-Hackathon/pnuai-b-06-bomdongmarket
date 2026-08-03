package com.farmbroker.farmbroker.user.domain;

// User가 플랫폼에서 맡는 역할을 구분하는 enum.
// OWNER: 공실 제공자 / FARMER: 도심 농부 / CONSUMER: 지역 소비자.
//
// 한 회원이 여러 역할을 동시에 가질 수 있다 — 공간을 빌려주면서 직접 농사도 짓는 경우가 실제로 존재한다.
// 따라서 가입 시 하나를 고르는 게 아니라 활동에 따라 누적된다(User.addRole 참고).
// DB에는 users.role 한 컬럼에 콤마로 이어 붙여 저장한다(UserRoleSetConverter).
//
// 선언 순서가 곧 직렬화 순서다 — 중간에 값을 끼워 넣으면 기존 행의 문자열 순서와 달라져
// 의미 없는 UPDATE가 발생할 수 있으니 새 역할은 뒤에 추가할 것.
public enum UserRole {
    OWNER,
    FARMER,
    CONSUMER
}
