package com.farmbroker.farmbroker.matching.domain;

import com.farmbroker.farmbroker.space.domain.Space;
import com.farmbroker.farmbroker.user.domain.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

// 도심 농부(farmer)가 특정 공간(space)에 보내는 매칭 신청 1건 = 1행.
// owner_id 컬럼은 두지 않는다 — 공간 소유자는 space.owner로 항상 유도 가능하고,
// 중복 저장하면 공간 소유권 이전 시 정합성이 깨질 수 있다 (응답의 ownerId는 조회 시 조인으로 채움).
// Space·User는 타 파트 소유 엔티티이므로 @ManyToOne(LAZY) 단방향 읽기 참조만 한다.
@Entity
@Table(name = "matchings", indexes = {
        @Index(name = "idx_matching_farmer", columnList = "farmer_id, created_at"),
        @Index(name = "idx_matching_space", columnList = "space_id, status")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class Matching {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "space_id", nullable = false)
    private Space space;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "farmer_id", nullable = false)
    private User farmer;

    @Column(nullable = false, length = 500)
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private MatchingStatus status;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // 수락/거절 시각. REQUESTED 상태에서는 null
    private LocalDateTime respondedAt;

    @Builder
    public Matching(Space space, User farmer, String message) {
        this.space = space;
        this.farmer = farmer;
        this.message = message;
        this.status = MatchingStatus.REQUESTED;
    }

    // 상태 전이는 REQUESTED에서만 허용된다 — 전제 검증(권한/현재 상태)은 서비스가 수행

    public void accept() {
        this.status = MatchingStatus.ACCEPTED;
        this.respondedAt = LocalDateTime.now();
    }

    public void reject() {
        this.status = MatchingStatus.REJECTED;
        this.respondedAt = LocalDateTime.now();
    }
}
