package com.farmbroker.farmbroker.space.dto;

import com.farmbroker.farmbroker.space.domain.Space;
import lombok.Getter;

import java.math.BigDecimal;

// 목록/내 공간 조회의 카드 UI용 요약 DTO. imageUrl은 대표 이미지(sortOrder=0) 1장만 담는다.
@Getter
public class SpaceListItemResponse {

    private final Long spaceId;
    private final String title;
    private final String address;
    private final BigDecimal area;
    private final Integer monthlyRent;
    private final String status;
    private final String imageUrl;

    private SpaceListItemResponse(Space space, String imageUrl) {
        this.spaceId = space.getId();
        this.title = space.getTitle();
        this.address = space.getAddress();
        this.area = space.getArea();
        this.monthlyRent = space.getMonthlyRent();
        this.status = space.getStatus().name();
        this.imageUrl = imageUrl;
    }

    public static SpaceListItemResponse from(Space space, String imageUrl) {
        return new SpaceListItemResponse(space, imageUrl);
    }
}
