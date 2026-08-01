package com.farmbroker.farmbroker.space.dto;

import lombok.Getter;

// 공간 삭제(Soft Delete) 응답 DTO (명세 2.6).
@Getter
public class SpaceDeleteResponse {

    private final Long spaceId;
    private final boolean deleted;

    private SpaceDeleteResponse(Long spaceId, boolean deleted) {
        this.spaceId = spaceId;
        this.deleted = deleted;
    }

    public static SpaceDeleteResponse of(Long spaceId, boolean deleted) {
        return new SpaceDeleteResponse(spaceId, deleted);
    }
}
