package com.farmbroker.farmbroker.matching.dto;

import com.farmbroker.farmbroker.matching.domain.Matching;
import com.farmbroker.farmbroker.matching.domain.MatchingStatus;
import lombok.Getter;

import java.time.LocalDateTime;

// 매칭 수락/거절(PATCH /matchings/{id}/accept·reject) 응답 DTO.
@Getter
public class MatchingStatusResponse {

    private final Long matchingId;
    private final MatchingStatus status;
    private final LocalDateTime respondedAt;

    private MatchingStatusResponse(Long matchingId, MatchingStatus status, LocalDateTime respondedAt) {
        this.matchingId = matchingId;
        this.status = status;
        this.respondedAt = respondedAt;
    }

    public static MatchingStatusResponse from(Matching matching) {
        return new MatchingStatusResponse(matching.getId(), matching.getStatus(), matching.getRespondedAt());
    }
}
