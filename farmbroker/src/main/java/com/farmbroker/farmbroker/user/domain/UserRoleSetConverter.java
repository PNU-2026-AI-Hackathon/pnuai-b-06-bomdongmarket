package com.farmbroker.farmbroker.user.domain;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import java.util.EnumSet;
import java.util.Set;
import java.util.stream.Collectors;

// 여러 역할을 users.role 한 컬럼에 콤마로 이어 붙여 저장하는 컨버터.
// 별도 테이블(@ElementCollection) 대신 단일 컬럼을 유지하는 이유는
// 역할이 3개뿐이고 "특정 역할 보유자 전체 조회" 요구사항이 아직 없기 때문이다.
// (그 요구가 생기면 LIKE 스캔 대신 user_roles 테이블로 옮기고,
//  User.hasRole/addRole 시그니처는 그대로 두면 호출부는 바뀌지 않는다.)
//
// 저장 형식: "CONSUMER" / "CONSUMER,OWNER" / "OWNER,FARMER,CONSUMER"
// EnumSet은 enum 선언 순으로 순회하므로 직렬화 결과가 항상 결정적이다 —
// 같은 조합이 다른 문자열로 저장돼 불필요한 UPDATE가 발생하는 일이 없다.
@Converter
public class UserRoleSetConverter implements AttributeConverter<Set<UserRole>, String> {

    private static final String DELIMITER = ",";

    @Override
    public String convertToDatabaseColumn(Set<UserRole> roles) {
        if (roles == null || roles.isEmpty()) {
            return "";
        }
        return normalize(roles).stream()
                .map(Enum::name)
                .collect(Collectors.joining(DELIMITER));
    }

    @Override
    public Set<UserRole> convertToEntityAttribute(String dbData) {
        // 역할 도입 이전 데이터(단일 값 "OWNER")도 그대로 파싱된다.
        if (dbData == null || dbData.isBlank()) {
            return EnumSet.noneOf(UserRole.class);
        }

        Set<UserRole> roles = EnumSet.noneOf(UserRole.class);
        for (String token : dbData.split(DELIMITER)) {
            String trimmed = token.trim();
            if (trimmed.isEmpty()) {
                continue;
            }
            try {
                roles.add(UserRole.valueOf(trimmed));
            } catch (IllegalArgumentException e) {
                // 알 수 없는 값은 무시한다 — 과거 데이터나 오타 하나로
                // 해당 회원의 모든 조회/로그인이 깨지는 상황을 막기 위한 방어.
            }
        }
        return roles;
    }

    // EnumSet으로 복사해 순회 순서를 enum 선언 순으로 고정한다.
    private Set<UserRole> normalize(Set<UserRole> roles) {
        return roles instanceof EnumSet ? roles : EnumSet.copyOf(roles);
    }
}
