package com.farmbroker.farmbroker.matching.support;

import com.farmbroker.farmbroker.space.domain.Space;
import com.farmbroker.farmbroker.space.domain.SpaceStatus;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

// [임시 — 소유: 백엔드 3] 2026-07-05 협의된 space 내부 계약의 요약 DTO.
// 백엔드 2 SpaceService가 공식 Summary를 제공하면 이 클래스를 삭제하고 그쪽으로 교체한다.
// deleted 여부와 무관하게 만들어진다 — 삭제된 공간도 매칭 이력에 제목을 노출하기 위함(협의 사항).
@Getter
@Builder
public class SpaceSummary {

    private final Long id;
    private final Long ownerId;
    private final String ownerNickname;
    private final String title;
    private final String thumbnailUrl;
    private final Integer monthlyRent;
    private final BigDecimal area;
    private final Integer floor;
    private final boolean hasWater;
    private final boolean hasElectricity;
    private final boolean hasVentilation;
    private final String description;
    private final SpaceStatus status;
    private final boolean deleted;

    public static SpaceSummary of(Space space, String thumbnailUrl) {
        return SpaceSummary.builder()
                .id(space.getId())
                .ownerId(space.getOwner().getId())
                .ownerNickname(space.getOwner().getNickname())
                .title(space.getTitle())
                .thumbnailUrl(thumbnailUrl)
                .monthlyRent(space.getMonthlyRent())
                .area(space.getArea())
                .floor(space.getFloor())
                .hasWater(space.isHasWater())
                .hasElectricity(space.isHasElectricity())
                .hasVentilation(space.isHasVentilation())
                .description(space.getDescription())
                .status(space.getStatus())
                .deleted(space.isDeleted())
                .build();
    }
}
