package com.farmbroker.farmbroker.matching.dto;

import com.farmbroker.farmbroker.matching.domain.Matching;
import com.farmbroker.farmbroker.matching.domain.MatchingStatus;
import com.farmbroker.farmbroker.matching.support.SpaceSummary;
import lombok.Getter;

import java.time.LocalDateTime;

// 내가 신청한 매칭 목록(GET /matchings/my-requests)의 항목 DTO.
// 프론트가 추가 호출 없이 목록 카드 한 장을 그릴 수 있도록
// 공간 요약(제목/대표이미지/월세/소유자 닉네임)을 함께 담는다 — SpaceSummary 배치 조회로 채움.
@Getter
public class MyMatchingResponse {

    private final Long matchingId;
    private final Long spaceId;
    private final String spaceTitle;
    private final String spaceImageUrl;
    private final Integer monthlyRent;
    private final String ownerNickname;
    private final MatchingStatus status;
    private final LocalDateTime createdAt;
    private final LocalDateTime respondedAt;

    private MyMatchingResponse(Long matchingId, Long spaceId, String spaceTitle, String spaceImageUrl,
                               Integer monthlyRent, String ownerNickname, MatchingStatus status,
                               LocalDateTime createdAt, LocalDateTime respondedAt) {
        this.matchingId = matchingId;
        this.spaceId = spaceId;
        this.spaceTitle = spaceTitle;
        this.spaceImageUrl = spaceImageUrl;
        this.monthlyRent = monthlyRent;
        this.ownerNickname = ownerNickname;
        this.status = status;
        this.createdAt = createdAt;
        this.respondedAt = respondedAt;
    }

    public static MyMatchingResponse of(Matching matching, SpaceSummary space) {
        return new MyMatchingResponse(
                matching.getId(),
                space.getId(),
                space.getTitle(),
                space.getThumbnailUrl(),
                space.getMonthlyRent(),
                space.getOwnerNickname(),
                matching.getStatus(),
                matching.getCreatedAt(),
                matching.getRespondedAt()
        );
    }
}
