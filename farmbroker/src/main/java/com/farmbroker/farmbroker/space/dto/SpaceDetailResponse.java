package com.farmbroker.farmbroker.space.dto;

import com.farmbroker.farmbroker.space.domain.Space;
import com.farmbroker.farmbroker.user.domain.User;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

// 공간 상세 조회(GET /spaces/{spaceId}) 응답 DTO.
// 등록자 요약(owner.userId / owner.nickname)과 전체 이미지 배열을 포함한다 (명세 2.3).
@Getter
public class SpaceDetailResponse {

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
    private final OwnerSummary owner;
    private final LocalDateTime createdAt;
    private final LocalDateTime updatedAt;

    private SpaceDetailResponse(Space space, List<String> imageUrls) {
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
        this.owner = OwnerSummary.from(space.getOwner());
        this.createdAt = space.getCreatedAt();
        this.updatedAt = space.getUpdatedAt();
    }

    public static SpaceDetailResponse from(Space space, List<String> imageUrls) {
        return new SpaceDetailResponse(space, imageUrls);
    }

    @Getter
    public static class OwnerSummary {

        private final Long userId;
        private final String nickname;

        private OwnerSummary(Long userId, String nickname) {
            this.userId = userId;
            this.nickname = nickname;
        }

        public static OwnerSummary from(User owner) {
            return new OwnerSummary(owner.getId(), owner.getNickname());
        }
    }
}
