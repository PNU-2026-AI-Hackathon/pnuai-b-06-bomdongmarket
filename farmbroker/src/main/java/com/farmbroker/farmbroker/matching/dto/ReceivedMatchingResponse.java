package com.farmbroker.farmbroker.matching.dto;

import com.farmbroker.farmbroker.matching.domain.Matching;
import com.farmbroker.farmbroker.matching.domain.MatchingStatus;
import lombok.Getter;

import java.time.LocalDateTime;

// 내가 받은 매칭 신청 목록(GET /matchings/received)의 항목 DTO.
// farmerId·닉네임을 포함해 수락 후 연락 흐름까지 대비한다.
// space·farmer는 레포지토리에서 fetch join으로 로딩된 상태를 전제로 한다.
@Getter
public class ReceivedMatchingResponse {

    private final Long matchingId;
    private final Long spaceId;
    private final String spaceTitle;
    private final Long farmerId;
    private final String farmerNickname;
    private final String message;
    private final MatchingStatus status;
    private final LocalDateTime createdAt;
    private final LocalDateTime respondedAt;

    private ReceivedMatchingResponse(Long matchingId, Long spaceId, String spaceTitle,
                                     Long farmerId, String farmerNickname, String message,
                                     MatchingStatus status, LocalDateTime createdAt, LocalDateTime respondedAt) {
        this.matchingId = matchingId;
        this.spaceId = spaceId;
        this.spaceTitle = spaceTitle;
        this.farmerId = farmerId;
        this.farmerNickname = farmerNickname;
        this.message = message;
        this.status = status;
        this.createdAt = createdAt;
        this.respondedAt = respondedAt;
    }

    public static ReceivedMatchingResponse from(Matching matching) {
        return new ReceivedMatchingResponse(
                matching.getId(),
                matching.getSpace().getId(),
                matching.getSpace().getTitle(),
                matching.getFarmer().getId(),
                matching.getFarmer().getNickname(),
                matching.getMessage(),
                matching.getStatus(),
                matching.getCreatedAt(),
                matching.getRespondedAt()
        );
    }
}
