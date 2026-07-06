package com.farmbroker.farmbroker.crop.dto;

import com.farmbroker.farmbroker.crop.domain.Crop;
import com.farmbroker.farmbroker.crop.domain.CropDifficulty;
import lombok.Getter;

// 작물 목록(GET /crops)의 항목 DTO — 카드 한 장에 필요한 요약 필드만 담는다.
@Getter
public class CropListResponse {

    private final Long cropId;
    private final String name;
    private final String category;
    private final CropDifficulty difficulty;
    private final Integer growingPeriodDays;
    private final Integer avgPricePerKg;
    private final String imageUrl;

    private CropListResponse(Long cropId, String name, String category, CropDifficulty difficulty,
                             Integer growingPeriodDays, Integer avgPricePerKg, String imageUrl) {
        this.cropId = cropId;
        this.name = name;
        this.category = category;
        this.difficulty = difficulty;
        this.growingPeriodDays = growingPeriodDays;
        this.avgPricePerKg = avgPricePerKg;
        this.imageUrl = imageUrl;
    }

    public static CropListResponse from(Crop crop) {
        return new CropListResponse(
                crop.getId(),
                crop.getName(),
                crop.getCategory(),
                crop.getDifficulty(),
                crop.getGrowingPeriodDays(),
                crop.getAvgPricePerKg(),
                crop.getImageUrl()
        );
    }
}
