package com.farmbroker.farmbroker.user.domain;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.EnumSet;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

// 한 회원이 여러 역할을 동시에 가질 수 있다는 도메인 규칙을 검증한다.
class UserRoleTest {

    private User newUser() {
        return User.builder()
                .email("farmer@example.com")
                .password("hashed")
                .nickname("도시농부")
                .build();
    }

    @Test
    @DisplayName("역할을 지정하지 않고 가입하면 CONSUMER로 시작한다")
    void defaultsToConsumer() {
        assertThat(newUser().getRoles()).containsExactly(UserRole.CONSUMER);
    }

    @Test
    @DisplayName("역할은 누적된다 — 공간 제공자이면서 농부일 수 있다")
    void accumulatesRoles() {
        User user = newUser();

        user.addRole(UserRole.OWNER);
        user.addRole(UserRole.FARMER);

        assertThat(user.getRoles())
                .containsExactlyInAnyOrder(UserRole.CONSUMER, UserRole.OWNER, UserRole.FARMER);
        assertThat(user.hasRole(UserRole.FARMER)).isTrue();
    }

    @Test
    @DisplayName("이미 가진 역할을 다시 추가해도 중복되지 않는다")
    void addingExistingRoleIsNoOp() {
        User user = newUser();

        user.addRole(UserRole.OWNER);
        user.addRole(UserRole.OWNER);

        assertThat(user.getRoles()).containsExactlyInAnyOrder(UserRole.CONSUMER, UserRole.OWNER);
    }

    @Test
    @DisplayName("getRoles로 받은 집합은 외부에서 수정할 수 없다")
    void rolesAreNotModifiableFromOutside() {
        User user = newUser();

        assertThatThrownBy(() -> user.getRoles().add(UserRole.OWNER))
                .isInstanceOf(UnsupportedOperationException.class);
    }

    @Test
    @DisplayName("초기 역할을 명시하면 그대로 사용한다")
    void honoursExplicitInitialRoles() {
        User user = User.builder()
                .email("owner@example.com")
                .password("hashed")
                .nickname("공간주")
                .roles(EnumSet.of(UserRole.OWNER))
                .build();

        assertThat(user.getRoles()).containsExactly(UserRole.OWNER);
    }
}
