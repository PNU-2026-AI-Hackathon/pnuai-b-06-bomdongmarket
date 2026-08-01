package com.farmbroker.farmbroker.space.dto;

import lombok.Getter;

import java.util.List;

// 공간 목록 조회(GET /spaces) 응답 DTO — 카드 목록 + 페이징 메타 (명세 2.2).
@Getter
public class SpaceListResponse {

    private final List<SpaceListItemResponse> content;
    private final int page;
    private final int size;
    private final long totalElements;
    private final int totalPages;

    private SpaceListResponse(List<SpaceListItemResponse> content, int page, int size,
                              long totalElements, int totalPages) {
        this.content = content;
        this.page = page;
        this.size = size;
        this.totalElements = totalElements;
        this.totalPages = totalPages;
    }

    public static SpaceListResponse of(List<SpaceListItemResponse> content, int page, int size,
                                       long totalElements, int totalPages) {
        return new SpaceListResponse(content, page, size, totalElements, totalPages);
    }
}
