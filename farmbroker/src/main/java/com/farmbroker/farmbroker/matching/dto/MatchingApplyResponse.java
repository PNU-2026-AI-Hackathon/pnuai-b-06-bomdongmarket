package com.farmbroker.farmbroker.matching.dto;

import com.farmbroker.farmbroker.matching.domain.Matching;
import com.farmbroker.farmbroker.matching.domain.MatchingStatus;
import lombok.Getter;

import java.time.LocalDateTime;

// 매칭 신청 성공 응답의 data 필드 DTO.
// ownerId는 Matching 엔티티에 없는 값이라(space.owner로 유도) 서비스에서 조회해 넘겨받는다.
@Getter
public class MatchingApplyResponse {

    private final Long matchingId;
    private final Long spaceId;
    private final Long farmerId;
    private final Long ownerId;
    private final String message;
    private final MatchingStatus status;
    private final LocalDateTime createdAt;

    private MatchingApplyResponse(Long matchingId, Long spaceId, Long farmerId, Long ownerId,
                                  String message, MatchingStatus status, LocalDateTime createdAt) {
        this.matchingId = matchingId;
        this.spaceId = spaceId;
        this.farmerId = farmerId;
        this.ownerId = ownerId;
        this.message = message;
        this.status = status;
        this.createdAt = createdAt;
    }

    public static MatchingApplyResponse of(Matching matching, Long ownerId) {
        return new MatchingApplyResponse(
                matching.getId(),
                matching.getSpace().getId(),
                matching.getFarmer().getId(),
                ownerId,
                matching.getMessage(),
                matching.getStatus(),
                matching.getCreatedAt()
        );
    }
}
