package com.farmbroker.farmbroker.crop.dto;

import com.farmbroker.farmbroker.crop.domain.Crop;
import com.farmbroker.farmbroker.crop.domain.CropDataSource;
import com.farmbroker.farmbroker.crop.domain.CropDifficulty;
import com.farmbroker.farmbroker.crop.domain.LightRequirement;
import lombok.Getter;

// 작물 상세(GET /crops/{cropId}) 응답 DTO — 재배 조건 전체 필드를 노출한다.
@Getter
public class CropDetailResponse {

    private final Long cropId;
    private final String name;
    private final String category;
    private final CropDifficulty difficulty;
    private final Integer growingPeriodDays;
    private final Double optimalTempMin;
    private final Double optimalTempMax;
    private final Double optimalHumidity;
    private final LightRequirement lightRequirement;
    private final Double yieldPerSqmKg;
    private final Integer avgPricePerKg;
    private final String description;
    private final String imageUrl;
    private final CropDataSource dataSource;

    private CropDetailResponse(Crop crop) {
        this.cropId = crop.getId();
        this.name = crop.getName();
        this.category = crop.getCategory();
        this.difficulty = crop.getDifficulty();
        this.growingPeriodDays = crop.getGrowingPeriodDays();
        this.optimalTempMin = crop.getOptimalTempMin();
        this.optimalTempMax = crop.getOptimalTempMax();
        this.optimalHumidity = crop.getOptimalHumidity();
        this.lightRequirement = crop.getLightRequirement();
        this.yieldPerSqmKg = crop.getYieldPerSqmKg();
        this.avgPricePerKg = crop.getAvgPricePerKg();
        this.description = crop.getDescription();
        this.imageUrl = crop.getImageUrl();
        this.dataSource = crop.getDataSource();
    }

    public static CropDetailResponse from(Crop crop) {
        return new CropDetailResponse(crop);
    }
}
