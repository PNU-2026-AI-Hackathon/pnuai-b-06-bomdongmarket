package com.farmbroker.farmbroker.user.domain;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.EnumSet;
import java.util.LinkedHashSet;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

// users.role 한 컬럼에 여러 역할을 담는 직렬화 규칙을 검증한다.
// 특히 "역할 도입 이전에 저장된 단일 값"이 그대로 읽히는지가 중요하다 —
// 이 프로젝트는 마이그레이션 도구 없이 ddl-auto=update만 쓰므로 기존 행이 그대로 남는다.
class UserRoleSetConverterTest {

    private final UserRoleSetConverter converter = new UserRoleSetConverter();

    @Test
    @DisplayName("여러 역할을 콤마로 이어 저장하고 그대로 복원한다")
    void convertsMultipleRolesRoundTrip() {
        Set<UserRole> roles = EnumSet.of(UserRole.OWNER, UserRole.CONSUMER);

        String stored = converter.convertToDatabaseColumn(roles);

        assertThat(stored).isEqualTo("OWNER,CONSUMER");
        assertThat(converter.convertToEntityAttribute(stored)).isEqualTo(roles);
    }

    @Test
    @DisplayName("입력 순서와 무관하게 enum 선언 순으로 직렬화한다")
    void serializesInDeclarationOrderRegardlessOfInputOrder() {
        Set<UserRole> insertionOrdered = new LinkedHashSet<>();
        insertionOrdered.add(UserRole.CONSUMER);
        insertionOrdered.add(UserRole.FARMER);
        insertionOrdered.add(UserRole.OWNER);

        assertThat(converter.convertToDatabaseColumn(insertionOrdered))
                .isEqualTo("OWNER,FARMER,CONSUMER");
    }

    @Test
    @DisplayName("역할 도입 이전의 단일 값도 그대로 읽는다")
    void readsLegacySingleValue() {
        assertThat(converter.convertToEntityAttribute("OWNER"))
                .containsExactly(UserRole.OWNER);
    }

    @Test
    @DisplayName("공백과 빈 토큰을 허용한다")
    void toleratesWhitespaceAndEmptyTokens() {
        assertThat(converter.convertToEntityAttribute(" OWNER , ,FARMER "))
                .containsExactlyInAnyOrder(UserRole.OWNER, UserRole.FARMER);
    }

    @Test
    @DisplayName("알 수 없는 값은 무시하고 나머지는 살린다")
    void ignoresUnknownTokens() {
        assertThat(converter.convertToEntityAttribute("OWNER,SELLER"))
                .containsExactly(UserRole.OWNER);
    }

    @Test
    @DisplayName("null · 빈 문자열은 빈 집합으로 읽고, 빈 집합은 빈 문자열로 쓴다")
    void handlesNullAndEmpty() {
        assertThat(converter.convertToEntityAttribute(null)).isEmpty();
        assertThat(converter.convertToEntityAttribute("")).isEmpty();
        assertThat(converter.convertToDatabaseColumn(null)).isEmpty();
        assertThat(converter.convertToDatabaseColumn(EnumSet.noneOf(UserRole.class))).isEmpty();
    }
}
