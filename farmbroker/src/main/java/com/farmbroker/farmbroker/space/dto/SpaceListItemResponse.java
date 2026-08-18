package com.farmbroker.farmbroker.space.dto;

import com.farmbroker.farmbroker.space.domain.Space;
import lombok.Getter;

import java.math.BigDecimal;

// 목록/내 공간 조회의 카드 UI용 요약 DTO. imageUrl은 대표 이미지(sortOrder=0) 1장만 담는다.
// 카드가 수도·전기·환기 아이콘을 실제 등록값대로 보여줘야 해서 상세 조회 없이 세 플래그도 함께 내려준다.
@Getter
public class SpaceListItemResponse {

    private final Long spaceId;
    private final String title;
    private final String address;
    private final BigDecimal area;
    private final Integer monthlyRent;
    private final boolean hasWater;
    private final boolean hasElectricity;
    private final boolean hasVentilation;
    private final String status;
    private final String imageUrl;
    private final Double latitude;
    private final Double longitude;

    private SpaceListItemResponse(Space space, String imageUrl) {
        this.spaceId = space.getId();
        this.title = space.getTitle();
        this.address = space.getAddress();
        this.area = space.getArea();
        this.monthlyRent = space.getMonthlyRent();
        this.hasWater = space.isHasWater();
        this.hasElectricity = space.isHasElectricity();
        this.hasVentilation = space.isHasVentilation();
        this.status = space.getStatus().name();
        this.imageUrl = imageUrl;
        this.latitude = space.getLatitude();
        this.longitude = space.getLongitude();
    }

    public static SpaceListItemResponse from(Space space, String imageUrl) {
        return new SpaceListItemResponse(space, imageUrl);
    }
}
