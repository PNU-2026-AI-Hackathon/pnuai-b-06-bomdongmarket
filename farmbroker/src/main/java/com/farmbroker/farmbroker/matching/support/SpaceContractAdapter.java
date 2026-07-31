package com.farmbroker.farmbroker.matching.support;

import com.farmbroker.farmbroker.common.exception.BusinessException;
import com.farmbroker.farmbroker.common.exception.ErrorCode;
import com.farmbroker.farmbroker.space.domain.Space;
import com.farmbroker.farmbroker.space.domain.SpaceImage;
import com.farmbroker.farmbroker.space.domain.SpaceStatus;
import com.farmbroker.farmbroker.space.repository.SpaceImageRepository;
import com.farmbroker.farmbroker.space.repository.SpaceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

// [임시 어댑터 — 소유: 백엔드 3]
// 2026-07-05 협의된 space 내부 계약(getSummaryById / getSummariesByIds / markMatched)이
// 백엔드 2 SpaceService에 아직 구현되지 않아, 동일 계약을 BE3 쪽에서 임시 제공한다.
// 규약 준수: 상태 전이는 Space 엔티티가 이 용도로 공개한 markMatched()만 사용하고 필드 직접 수정은 없다.
// 백엔드 2가 SpaceService에 계약 메서드를 추가하면 이 클래스와 SpaceSummary를 삭제하고 그쪽을 주입한다.
@Component
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SpaceContractAdapter {

    private final SpaceRepository spaceRepository;
    private final SpaceImageRepository spaceImageRepository;

    // 단건 요약 — 미존재만 SPACE_NOT_FOUND. deleted여도 예외 없이 반환(협의 사항, 이력 노출용)
    public SpaceSummary getSummaryById(Long spaceId) {
        Space space = spaceRepository.findById(spaceId)
                .orElseThrow(() -> new BusinessException(ErrorCode.SPACE_NOT_FOUND));
        String thumbnailUrl = spaceImageRepository.findBySpaceIdOrderBySortOrderAsc(spaceId).stream()
                .findFirst()
                .map(SpaceImage::getImageUrl)
                .orElse(null);
        return SpaceSummary.of(space, thumbnailUrl);
    }

    // 배치 요약 — 매칭 목록 조회의 N+1 방지용. 대표 이미지도 IN 쿼리 1번으로 채운다
    public List<SpaceSummary> getSummariesByIds(List<Long> spaceIds) {
        if (spaceIds.isEmpty()) {
            return List.of();
        }
        Map<Long, String> thumbnails = new HashMap<>();
        for (SpaceImage image : spaceImageRepository.findBySpaceIdInOrderBySortOrderAsc(spaceIds)) {
            thumbnails.putIfAbsent(image.getSpace().getId(), image.getImageUrl()); // 첫 항목 = sortOrder 최솟값(대표)
        }
        return spaceRepository.findAllById(spaceIds).stream()
                .map(space -> SpaceSummary.of(space, thumbnails.get(space.getId())))
                .toList();
    }

    // 매칭 수락 시 공간 상태 전환 — AVAILABLE·미삭제 검증 위반 시 SPACE_NOT_AVAILABLE(409).
    // REQUIRED 전파로 수락 트랜잭션에 참여해 원자성을 보장한다
    @Transactional
    public void markMatched(Long spaceId) {
        Space space = spaceRepository.findById(spaceId)
                .orElseThrow(() -> new BusinessException(ErrorCode.SPACE_NOT_FOUND));
        if (space.isDeleted() || space.getStatus() != SpaceStatus.AVAILABLE) {
            throw new BusinessException(ErrorCode.SPACE_NOT_AVAILABLE);
        }
        space.markMatched();
    }
}
