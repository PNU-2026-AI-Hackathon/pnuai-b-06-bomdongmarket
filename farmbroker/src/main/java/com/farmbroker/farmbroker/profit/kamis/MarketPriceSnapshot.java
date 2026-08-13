package com.farmbroker.farmbroker.profit.kamis;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

// 수집해 둔 KAMIS 시세. 작물당 최신 1건만 유지한다.
// 수익 계산은 요청마다 외부 API를 부르지 않고 이 표를 읽는다 —
// 외부 API 지연이 그대로 응답 시간이 되고, 장애 시 계산 자체가 막히기 때문이다.
@Entity
@Table(
        name = "market_price_snapshots",
        uniqueConstraints = @UniqueConstraint(name = "uk_price_crop", columnNames = "crop_name")
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MarketPriceSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "crop_name", nullable = false, length = 60)
    private String cropName;

    @Column(nullable = false)
    private Integer pricePerKgKrw;

    // 시세를 언제 조사한 값인지. 수집한 시각이 아니라 KAMIS의 조사일자다 — 신선도 판단 기준.
    @Column(nullable = false)
    private LocalDate surveyedOn;

    // 대표값 산출에 쓰인 조사 건수. 1건이면 표본이 얕다는 뜻이라 검증에 쓴다.
    @Column(nullable = false)
    private Integer sampleCount;

    @Column(nullable = false)
    private LocalDateTime collectedAt;

    @Column(name = "sale_type", length = 10)
    private String saleType;

    @Column(length = 40)
    private String region;

    @Column(length = 20)
    private String grade;

    public MarketPriceSnapshot(String cropName, int pricePerKgKrw, LocalDate surveyedOn,
                               int sampleCount, LocalDateTime collectedAt,
                               String saleType, String region, String grade) {
        this.cropName = cropName;
        this.pricePerKgKrw = pricePerKgKrw;
        this.surveyedOn = surveyedOn;
        this.sampleCount = sampleCount;
        this.collectedAt = collectedAt;
        this.saleType = saleType;
        this.region = region;
        this.grade = grade;
    }

    // 이전 기본 생성 경로도 출처 기준이 비지 않도록 당시 기본값을 명시한다.
    public MarketPriceSnapshot(String cropName, int pricePerKgKrw, LocalDate surveyedOn,
                               int sampleCount, LocalDateTime collectedAt) {
        this(cropName, pricePerKgKrw, surveyedOn, sampleCount, collectedAt, "02", "", "상품");
    }

    public void refresh(int pricePerKgKrw, LocalDate surveyedOn, int sampleCount, LocalDateTime collectedAt,
                        String saleType, String region, String grade) {
        this.pricePerKgKrw = pricePerKgKrw;
        this.surveyedOn = surveyedOn;
        this.sampleCount = sampleCount;
        this.collectedAt = collectedAt;
        this.saleType = saleType;
        this.region = region;
        this.grade = grade;
    }
}
