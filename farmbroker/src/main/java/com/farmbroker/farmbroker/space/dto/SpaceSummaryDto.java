package com.farmbroker.farmbroker.space.dto;

import com.farmbroker.farmbroker.space.domain.Space;

// BE3(matching)와 합의한 내부 인터페이스 DTO — BE3회신.md에서 필드 확정 (작업명세서 5.1).
// 공개 API 응답과 달리 deleted 플래그를 그대로 노출한다: BE3가 매칭 신청 시 deleted를 보고 거부하고,
// 매칭 이력에서는 삭제된 공간의 제목도 표시해야 하기 때문. 필드 추가/변경은 BE3와 합의 후에만 할 것.
public record SpaceSummaryDto(
        Long spaceId,
        Long ownerId,           // 매칭 권한 검증용
        String ownerNickname,   // 매칭 목록 표시용
        String title,
        String address,
        Double area,            // AI 프롬프트 입력
        Integer monthlyRent,
        Integer floor,
        boolean hasWater,
        boolean hasElectricity,
        boolean hasVentilation,
        String description,
        String status,          // AVAILABLE / MATCHED / CLOSED
        boolean deleted,        // Soft Delete 필터용
        String thumbnailUrl     // 대표 이미지(sortOrder=0) 1장
) {

    public static SpaceSummaryDto from(Space space, String thumbnailUrl) {
        return new SpaceSummaryDto(
                space.getId(),
                space.getOwner().getId(),
                space.getOwner().getNickname(),
                space.getTitle(),
                space.getAddress(),
                space.getArea().doubleValue(),
                space.getMonthlyRent(),
                space.getFloor(),
                space.isHasWater(),
                space.isHasElectricity(),
                space.isHasVentilation(),
                space.getDescription(),
                space.getStatus().name(),
                space.isDeleted(),
                thumbnailUrl
        );
    }
}
