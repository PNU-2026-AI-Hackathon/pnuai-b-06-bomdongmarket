package com.farmbroker.farmbroker.product.domain;

import com.farmbroker.farmbroker.user.domain.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDate;
import java.time.LocalDateTime;

// 로컬마켓 상품 엔티티. 당근마켓 스타일로 판매자(인증 사용자)가 등록/수정/삭제한다.
// 삭제는 물리 삭제 대신 deleted 플래그(Soft Delete) — space 도메인 컨벤션과 동일.
// 이력 이벤트는 역방향 컬렉션을 두지 않고 ProductTraceabilityEvent + 별도 레포지토리로 관리한다(SpaceImage와 동일 패턴).
//
// [위치] address/latitude/longitude 는 Task 3(지도)에서 사용한다. 위경도는 지오코딩/수동 입력 전까지 null일 수 있다.
// [spaceId] '작업장에서 가져오기'로 Space 정보를 폼에 채운 경우 그 출처를 남기는 스냅샷이다.
//           Space 도메인과의 결합을 피하려 FK/JPA 연관을 두지 않고 순수 Long 값만 보관한다.
//           (등록 시점의 위치가 그대로 복사되므로 이후 Space 변경/삭제와 무관하다.)
@Entity
@Table(name = "products", indexes = {
        @Index(name = "idx_product_seller_id", columnList = "seller_id"),
        @Index(name = "idx_product_deleted", columnList = "deleted"),
        @Index(name = "idx_product_category", columnList = "category")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 판매자. 항상 인증 컨텍스트의 userId로 조회한 User를 넣는다 — 요청 body의 sellerId는 받지 않는다.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seller_id", nullable = false)
    private User seller;

    @Column(nullable = false, length = 100)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ProductCategory category;

    // 판매 가격(원)
    @Column(nullable = false)
    private Integer price;

    // 판매 단위(팩/묶음/봉/박스 등)
    @Column(nullable = false, length = 20)
    private String unit;

    // 재고 — 주문/결제가 없으므로 정보성 값이다(구매로 차감되지 않는다).
    @Column(nullable = false)
    private Integer stock;

    @Column(length = 500)
    private String imageUrl;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private LocalDate harvestDate;

    // 생산자/농장명. 미입력 시 서비스에서 seller.nickname으로 채운다.
    @Column(nullable = false, length = 60)
    private String producerName;

    // 표시용 위치명(예: 장전 스마트팜)
    @Column(nullable = false, length = 255)
    private String productionLocation;

    @Column(length = 255)
    private String address;

    @Column
    private Double latitude;

    @Column
    private Double longitude;

    // Space '가져오기' 출처 스냅샷 — FK/연관 없음(위 클래스 주석 참고).
    @Column
    private Long spaceId;

    @Column
    private Double foodMileageKm;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ProductStatus status;

    @Column(nullable = false)
    private boolean deleted;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @Builder
    public Product(User seller, String name, ProductCategory category, Integer price, String unit,
                   Integer stock, String imageUrl, String description, LocalDate harvestDate,
                   String producerName, String productionLocation, String address,
                   Double latitude, Double longitude, Long spaceId, Double foodMileageKm) {
        this.seller = seller;
        this.name = name;
        this.category = category;
        this.price = price;
        this.unit = unit;
        this.stock = stock;
        this.imageUrl = imageUrl;
        this.description = description;
        this.harvestDate = harvestDate;
        this.producerName = producerName;
        this.productionLocation = productionLocation;
        this.address = address;
        this.latitude = latitude;
        this.longitude = longitude;
        this.spaceId = spaceId;
        this.foodMileageKm = foodMileageKm;
        this.status = ProductStatus.ON_SALE;
        this.deleted = false;
    }

    // PATCH 부분수정 — null이 아닌 필드만 반영한다(space 도메인과 동일한 null=변경없음 규칙).
    // 이력 이벤트는 서비스에서 전량 교체로 별도 처리한다.
    public void update(String name, ProductCategory category, Integer price, String unit, Integer stock,
                       String imageUrl, String description, LocalDate harvestDate, String producerName,
                       String productionLocation, String address, Double latitude, Double longitude,
                       Long spaceId, Double foodMileageKm, ProductStatus status) {
        if (name != null) this.name = name;
        if (category != null) this.category = category;
        if (price != null) this.price = price;
        if (unit != null) this.unit = unit;
        if (stock != null) this.stock = stock;
        if (imageUrl != null) this.imageUrl = imageUrl;
        if (description != null) this.description = description;
        if (harvestDate != null) this.harvestDate = harvestDate;
        if (producerName != null) this.producerName = producerName;
        if (productionLocation != null) this.productionLocation = productionLocation;
        if (address != null) this.address = address;
        if (latitude != null) this.latitude = latitude;
        if (longitude != null) this.longitude = longitude;
        if (spaceId != null) this.spaceId = spaceId;
        if (foodMileageKm != null) this.foodMileageKm = foodMileageKm;
        if (status != null) this.status = status;
    }

    public void softDelete() {
        this.deleted = true;
    }
}
