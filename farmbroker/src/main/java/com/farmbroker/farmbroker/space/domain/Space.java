package com.farmbroker.farmbroker.space.domain;

import com.farmbroker.farmbroker.user.domain.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;

// 공간(공실) 매물 엔티티. space 도메인의 핵심이며 matching(BE3)·prediction이 space_id로 참조한다.
// 삭제는 물리 삭제 대신 deleted 플래그(Soft Delete) — 타 도메인의 FK 무결성과 매칭 이력 보존을 위함.
// 연관관계는 단방향 @ManyToOne만 사용하고 역방향 컬렉션은 두지 않는다 (팀 컨벤션).
@Entity
@Table(name = "spaces", indexes = {
        @Index(name = "idx_space_owner_id", columnList = "owner_id"),
        @Index(name = "idx_space_status", columnList = "status"),
        @Index(name = "idx_space_deleted", columnList = "deleted")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class Space {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 등록자(OWNER). 항상 인증 컨텍스트의 userId로 조회한 User를 넣는다 — 요청 body의 ownerId는 받지 않는다.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(nullable = false, length = 255)
    private String address;

    // 면적(㎡)
    @Column(nullable = false, precision = 7, scale = 2)
    private BigDecimal area;

    // 월세(원/월)
    @Column(nullable = false)
    private Integer monthlyRent;

    @Column
    private Integer floor;

    @Column(nullable = false)
    private boolean hasWater;

    @Column(nullable = false)
    private boolean hasElectricity;

    @Column(nullable = false)
    private boolean hasVentilation;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SpaceStatus status;

    @Column(nullable = false)
    private boolean deleted;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @Builder
    public Space(User owner, String title, String address, BigDecimal area, Integer monthlyRent,
                 Integer floor, boolean hasWater, boolean hasElectricity, boolean hasVentilation,
                 String description) {
        this.owner = owner;
        this.title = title;
        this.address = address;
        this.area = area;
        this.monthlyRent = monthlyRent;
        this.floor = floor;
        this.hasWater = hasWater;
        this.hasElectricity = hasElectricity;
        this.hasVentilation = hasVentilation;
        this.description = description;
        this.status = SpaceStatus.AVAILABLE;
        this.deleted = false;
    }

    // ── 상태 변경 (setter 대신 의도가 드러나는 메서드만 공개) ──────────────────

    // PATCH 부분수정 — null이 아닌 필드만 반영한다. status/이미지는 별도 처리.
    public void update(String title, String address, BigDecimal area, Integer monthlyRent,
                       Integer floor, Boolean hasWater, Boolean hasElectricity, Boolean hasVentilation,
                       String description) {
        if (title != null) this.title = title;
        if (address != null) this.address = address;
        if (area != null) this.area = area;
        if (monthlyRent != null) this.monthlyRent = monthlyRent;
        if (floor != null) this.floor = floor;
        if (hasWater != null) this.hasWater = hasWater;
        if (hasElectricity != null) this.hasElectricity = hasElectricity;
        if (hasVentilation != null) this.hasVentilation = hasVentilation;
        if (description != null) this.description = description;
    }

    // OWNER의 직접 상태 전환 (AVAILABLE/CLOSED). MATCHED 검증은 서비스에서 수행 후 호출된다.
    public void changeStatus(SpaceStatus status) {
        this.status = status;
    }

    // 매칭 수락 시 matching 도메인(BE3)이 SpaceService.markMatched()를 통해 호출.
    public void markMatched() {
        this.status = SpaceStatus.MATCHED;
    }

    public void softDelete() {
        this.deleted = true;
    }
}
