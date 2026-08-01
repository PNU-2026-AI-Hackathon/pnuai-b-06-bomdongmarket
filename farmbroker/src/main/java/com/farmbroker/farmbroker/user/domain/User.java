package com.farmbroker.farmbroker.user.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

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

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role;

    // @CreatedDate: 엔티티 최초 저장 시점을 자동 기록. @EnableJpaAuditing 없이는 동작하지 않는다.
    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Builder
    public User(String email, String password, String nickname, UserRole role) {
        this.email = email;
        this.password = password;
        this.nickname = nickname;
        this.role = role;
    }
}
