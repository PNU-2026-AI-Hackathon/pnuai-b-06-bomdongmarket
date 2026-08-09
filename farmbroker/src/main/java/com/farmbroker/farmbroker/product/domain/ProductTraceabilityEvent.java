package com.farmbroker.farmbroker.product.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

// 상품의 생산 이력 이벤트(파종/정식/수확/배송 등). 소비자에게 신뢰성 있는 생산 과정을 보여주기 위한 데이터.
// 상품당 여러 개이며, Product에 역방향 컬렉션을 두지 않고 이 엔티티 + 별도 레포지토리로 관리한다(SpaceImage 패턴).
// 상품 수정 시에는 전량 삭제 후 재삽입(replace)한다.
@Entity
@Table(name = "product_trace_events", indexes = {
        @Index(name = "idx_trace_product_id", columnList = "product_id")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ProductTraceabilityEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    // 단계명(파종/정식/수확/배송 등). 자유 문자열로 두어 작물별 다양한 공정을 표현할 수 있게 한다.
    @Column(nullable = false, length = 40)
    private String stage;

    @Column(length = 255)
    private String description;

    @Column(nullable = false)
    private LocalDate occurredAt;

    // 표시 순서 — 등록 배열 순서대로 매긴다.
    @Column(nullable = false)
    private int sortOrder;

    @Builder
    public ProductTraceabilityEvent(Product product, String stage, String description,
                                    LocalDate occurredAt, int sortOrder) {
        this.product = product;
        this.stage = stage;
        this.description = description;
        this.occurredAt = occurredAt;
        this.sortOrder = sortOrder;
    }
}
