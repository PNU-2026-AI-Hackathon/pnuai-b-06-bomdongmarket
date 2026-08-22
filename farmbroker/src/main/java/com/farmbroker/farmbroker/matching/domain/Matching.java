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

import java.time.LocalDate;
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

    // 신청 유형(수익/취미). 요청 단계에서 @NotNull로 강제하지만 컬럼은 nullable로 둔다 —
    // ddl-auto=update는 기존 행이 있는 테이블에 NOT NULL 컬럼을 추가하지 못하므로
    // 유형 도입 이전에 쌓인 신청은 null(미지정)로 남는다.
    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private MatchingType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private MatchingStatus status;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // 수락/거절 시각. REQUESTED 상태에서는 null
    private LocalDateTime respondedAt;

    // 공간 소유자가 검토를 마친 신청을 받은 목록에서 치운 시각. 안 치웠으면 null.
    // 신청 자체는 그대로 남고 신청자 화면(my-requests)에는 계속 보인다 —
    // 소유자 목록에서만 감추는 표시라 상태(status) 전이와는 별개다.
    private LocalDateTime ownerDismissedAt;

    // ── 계약서 ───────────────────────────────────────────────────────────────
    // 매칭 1건당 계약서 1건이라 별도 테이블을 두지 않고 같은 행에 담는다.
    // 계약 진행 상태도 별도 컬럼을 두지 않는다 — status가 그대로 나타낸다
    // (REQUESTED=협의 중, ACCEPTED=확정, REJECTED=계약 취소, CANCELED=신청 철회).
    // 신청 시점에는 아무것도 정해지지 않았으므로 전부 nullable이며,
    // ddl-auto=update가 기존 행이 있는 테이블에 NOT NULL 컬럼을 추가하지 못하는 제약과도 맞는다.
    // 조건 입력은 공간 소유자만 가능하고(권한 검증은 서비스), 저장된 값은 양측이 함께 본다.
    private Integer contractMonthlyRent;

    private Integer contractMaintenanceFee;

    // 관리비를 내는 쪽. 금액과 짝이라 관리비와 함께 저장된다.
    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private MaintenanceFeePayer contractMaintenanceFeePayer;

    private Integer contractDeposit;

    private LocalDate contractStartDate;

    private LocalDate contractEndDate;

    // 조건을 저장할 때마다 1씩 오르는 번호. 동의 요청이 "내가 본 조건"을 지목하는 데 쓴다 —
    // 조회한 뒤 소유자가 조건을 바꿨다면 번호가 어긋나 동의가 거절된다(검증은 서비스).
    private Integer contractTermsVersion;

    // 계약 동의 시각. 양측이 모두 채워지면 확정이다.
    private LocalDateTime ownerAgreedAt;

    private LocalDateTime farmerAgreedAt;

    // 계약을 취소한 쪽. 아직 취소되지 않았거나, 확정에 밀려 자동 거절된 신청은 null이다
    // (벌크 UPDATE로 정리되는 건에는 '취소를 누른 사람'이 없다).
    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private ContractParty contractCanceledBy;

    @Builder
    public Matching(Space space, User farmer, String message, MatchingType type) {
        this.space = space;
        this.farmer = farmer;
        this.message = message;
        this.type = type;
        this.status = MatchingStatus.REQUESTED;
    }

    // 상태 전이는 REQUESTED에서만 허용된다 — 전제 검증(권한/현재 상태)은 서비스가 수행

    // 양측이 계약에 동의해 최종 계약이 성립한 상태.
    public void accept() {
        this.status = MatchingStatus.ACCEPTED;
        this.respondedAt = LocalDateTime.now();
    }

    // 한쪽이 계약을 취소한 상태. 되돌릴 수 없다.
    // 누가 눌렀는지 함께 남긴다 — 동의 현황에 취소 표시를 누른 쪽에만 붙이려면 필요하다.
    public void reject(ContractParty canceledBy) {
        this.status = MatchingStatus.REJECTED;
        this.contractCanceledBy = canceledBy;
        this.respondedAt = LocalDateTime.now();
    }

    // 신청자 본인 취소. 행을 지우지 않고 CANCELED로 남겨 신청 이력을 보존한다.
    // 철회할 수 있는 사람은 신청자(도심 농부)뿐이라 취소한 쪽도 언제나 FARMER다.
    public void cancel() {
        this.status = MatchingStatus.CANCELED;
        this.contractCanceledBy = ContractParty.FARMER;
        this.respondedAt = LocalDateTime.now();
    }

    // 소유자가 받은 목록에서 감추기. 상태는 건드리지 않는다(전제 검증은 서비스).
    public void dismissByOwner() {
        this.ownerDismissedAt = LocalDateTime.now();
    }

    // ── 계약서 (전제 검증은 서비스) ──────────────────────────────────────────

    // 조건을 바꾸면 양측 동의를 함께 지운다 —
    // 동의를 남겨두면 상대가 동의한 적 없는 금액·기간으로 계약이 확정될 수 있다.
    public void updateContractTerms(Integer monthlyRent, Integer maintenanceFee,
                                    MaintenanceFeePayer maintenanceFeePayer, Integer deposit,
                                    LocalDate startDate, LocalDate endDate) {
        this.contractMonthlyRent = monthlyRent;
        this.contractMaintenanceFee = maintenanceFee;
        this.contractMaintenanceFeePayer = maintenanceFeePayer;
        this.contractDeposit = deposit;
        this.contractStartDate = startDate;
        this.contractEndDate = endDate;
        this.contractTermsVersion = getTermsVersion() + 1;
        this.ownerAgreedAt = null;
        this.farmerAgreedAt = null;
    }

    // 조건을 한 번도 저장하지 않은 계약(과 컬럼 추가 이전의 기존 행)은 0번이다.
    public int getTermsVersion() {
        return contractTermsVersion == null ? 0 : contractTermsVersion;
    }

    // 이미 동의했으면 시각을 유지한다 — 같은 버튼을 두 번 눌러도 결과가 같다.
    // 계약 확정에 따르는 매칭 상태 전이는 공간·역할 변경까지 함께 일어나야 해서 서비스가 수행한다.
    public void agreeContractAsOwner() {
        if (this.ownerAgreedAt == null) {
            this.ownerAgreedAt = LocalDateTime.now();
        }
    }

    public void agreeContractAsFarmer() {
        if (this.farmerAgreedAt == null) {
            this.farmerAgreedAt = LocalDateTime.now();
        }
    }

    public boolean hasContractTerms() {
        return contractMonthlyRent != null && contractMaintenanceFee != null
                && contractMaintenanceFeePayer != null && contractDeposit != null
                && contractStartDate != null && contractEndDate != null;
    }
}
