package com.farmbroker.farmbroker.crop.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

// 작물 백과사전 엔티티 — 스마트팜 재배 관점의 기준 데이터.
// yield_per_sqm_kg·avg_price_per_kg는 AI 추천의 예상 수확량 계산과
// 수익 예측(prediction) 모듈의 기본값으로도 제공되는 모듈 간 연결 고리다.
@Entity
@Table(name = "crops")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Crop {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String name;

    @Column(nullable = false, length = 30)
    private String category;

    @Column(nullable = false)
    private Integer growingPeriodDays;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private CropDifficulty difficulty;

    private Double optimalTempMin;

    private Double optimalTempMax;

    private Double optimalHumidity;

    @Enumerated(EnumType.STRING)
    @Column(length = 10)
    private LightRequirement lightRequirement;

    private Double yieldPerSqmKg;

    private Integer avgPricePerKg;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 500)
    private String imageUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CropDataSource dataSource;

    @Builder
    public Crop(String name, String category, Integer growingPeriodDays, CropDifficulty difficulty,
                Double optimalTempMin, Double optimalTempMax, Double optimalHumidity,
                LightRequirement lightRequirement, Double yieldPerSqmKg, Integer avgPricePerKg,
                String description, String imageUrl, CropDataSource dataSource) {
        this.name = name;
        this.category = category;
        this.growingPeriodDays = growingPeriodDays;
        this.difficulty = difficulty;
        this.optimalTempMin = optimalTempMin;
        this.optimalTempMax = optimalTempMax;
        this.optimalHumidity = optimalHumidity;
        this.lightRequirement = lightRequirement;
        this.yieldPerSqmKg = yieldPerSqmKg;
        this.avgPricePerKg = avgPricePerKg;
        this.description = description;
        this.imageUrl = imageUrl;
        this.dataSource = dataSource != null ? dataSource : CropDataSource.SEED;
    }
}
