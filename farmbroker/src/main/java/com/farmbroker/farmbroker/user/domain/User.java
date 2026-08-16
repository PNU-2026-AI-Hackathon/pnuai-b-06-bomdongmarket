package com.farmbroker.farmbroker.user.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.EnumSet;
import java.util.Set;

// 회원 정보를 담는 JPA 엔티티.
// 비밀번호는 BCrypt 해시 값만 저장하고, 응답 DTO로 변환할 때 password 필드는 절대 포함하지 않는다.
// @NoArgsConstructor(PROTECTED): JPA 프록시 생성용 기본 생성자를 열되, 외부에서 직접 new User()를 막아
// 반드시 Builder를 통해 생성하도록 강제한다.
@Entity
@Table(name = "users")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String nickname;

    // 역할은 가입 시 고르는 값이 아니라 활동에 따라 누적되는 값이다.
    // 가입 시 CONSUMER로 시작하고, 공간을 등록하면 OWNER가, 매칭이 수락되면 FARMER가 더해진다.
    // 여러 값을 기존 role 컬럼 하나에 콤마로 저장한다(UserRoleSetConverter).
    // @Enumerated는 @Convert와 함께 쓸 수 없으므로 사용하지 않는다.
    @Convert(converter = UserRoleSetConverter.class)
    @Column(name = "role", nullable = false)
    private Set<UserRole> roles;

    // @CreatedDate: 엔티티 최초 저장 시점을 자동 기록. @EnableJpaAuditing 없이는 동작하지 않는다.
    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column
    private LocalDateTime withdrawnAt;

    @Builder
    public User(String email, String password, String nickname, Set<UserRole> roles) {
        this.email = email;
        this.password = password;
        this.nickname = nickname;
        // 역할을 지정하지 않으면 기본 소비자 — role 컬럼이 NOT NULL이라 빈 값을 두지 않는다.
        this.roles = (roles == null || roles.isEmpty())
                ? EnumSet.of(UserRole.CONSUMER)
                : EnumSet.copyOf(roles);
    }

    public Set<UserRole> getRoles() {
        return Collections.unmodifiableSet(roles);
    }

    public boolean hasRole(UserRole role) {
        return roles.contains(role);
    }

    // 역할 추가 — 이미 보유 중이면 아무 일도 하지 않는다.
    // 컬렉션을 제자리에서 수정하지 않고 새 EnumSet을 할당하는 이유:
    // @Convert 속성의 MutabilityPlan에 따라 in-place 변경이 더티 체킹에서 누락될 수 있어
    // 참조를 교체해야 UPDATE가 확실히 발생한다.
    public void addRole(UserRole role) {
        if (roles.contains(role)) {
            return;
        }
        Set<UserRole> updated = EnumSet.copyOf(roles);
        updated.add(role);
        this.roles = updated;
    }

    public void updateNickname(String nickname) {
        this.nickname = nickname;
    }

    public void changePassword(String encodedPassword) {
        this.password = encodedPassword;
    }

    public void withdraw(String anonymizedEmail, String anonymizedPassword) {
        this.email = anonymizedEmail;
        this.nickname = "탈퇴한 사용자";
        this.password = anonymizedPassword;
        this.withdrawnAt = LocalDateTime.now();
    }
}
