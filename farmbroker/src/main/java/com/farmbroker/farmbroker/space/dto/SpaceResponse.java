package com.farmbroker.farmbroker.space.dto;

import com.farmbroker.farmbroker.space.domain.Space;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

// 등록(POST)/수정(PATCH) 응답 DTO. 엔티티 PK(id)를 spaceId로 노출한다 (팀 컨벤션).
// 상세 조회와 달리 owner를 펼치지 않고 ownerId만 담는다 (명세 2.1/2.5).
@Getter
public class SpaceResponse {

    private final Long spaceId;
    private final String title;
    private final String address;
    private final BigDecimal area;
    private final Integer monthlyRent;
    private final Integer floor;
    private final boolean hasWater;
    private final boolean hasElectricity;
    private final boolean hasVentilation;
    private final String description;
    private final List<String> imageUrls;
    private final String status;
    private final Long ownerId;
    private final LocalDateTime createdAt;
    private final LocalDateTime updatedAt;

    private SpaceResponse(Space space, List<String> imageUrls) {
        this.spaceId = space.getId();
        this.title = space.getTitle();
        this.address = space.getAddress();
        this.area = space.getArea();
        this.monthlyRent = space.getMonthlyRent();
        this.floor = space.getFloor();
        this.hasWater = space.isHasWater();
        this.hasElectricity = space.isHasElectricity();
        this.hasVentilation = space.isHasVentilation();
        this.description = space.getDescription();
        this.imageUrls = imageUrls;
        this.status = space.getStatus().name();
        this.ownerId = space.getOwner().getId();
        this.createdAt = space.getCreatedAt();
        this.updatedAt = space.getUpdatedAt();
    }

    public static SpaceResponse from(Space space, List<String> imageUrls) {
        return new SpaceResponse(space, imageUrls);
    }
}
