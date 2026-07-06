package com.farmbroker.farmbroker.matching.service;

import com.farmbroker.farmbroker.common.exception.BusinessException;
import com.farmbroker.farmbroker.common.exception.ErrorCode;
import com.farmbroker.farmbroker.matching.domain.Matching;
import com.farmbroker.farmbroker.matching.domain.MatchingStatus;
import com.farmbroker.farmbroker.matching.dto.MatchingApplyRequest;
import com.farmbroker.farmbroker.matching.dto.MatchingApplyResponse;
import com.farmbroker.farmbroker.matching.repository.MatchingRepository;
import com.farmbroker.farmbroker.space.domain.Space;
import com.farmbroker.farmbroker.space.domain.SpaceStatus;
import com.farmbroker.farmbroker.space.dto.SpaceSummary;
import com.farmbroker.farmbroker.space.service.SpaceService;
import com.farmbroker.farmbroker.user.domain.User;
import com.farmbroker.farmbroker.user.domain.UserRole;
import com.farmbroker.farmbroker.user.repository.UserRepository;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

// 매칭 신청/조회/수락/거절 비즈니스 로직.
// Space 접근은 백엔드 2가 제공하는 SpaceService 계약(getSummaryById 등)만 사용하고
// SpaceRepository를 직접 주입하지 않는다 — 엔티티 연관관계 세팅에만 EntityManager.getReference로
// 프록시를 얻어 불필요한 SELECT 없이 FK만 저장한다.
// 역할(FARMER) 검증은 JWT 필터가 authorities를 비워두므로(백엔드 1 규약)
// Security 애노테이션 대신 서비스 레이어에서 User 조회 후 직접 체크한다.
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MatchingService {

    private final MatchingRepository matchingRepository;
    private final UserRepository userRepository;
    private final SpaceService spaceService;
    private final EntityManager entityManager;

    @Transactional
    public MatchingApplyResponse apply(Long userId, MatchingApplyRequest request) {
        User farmer = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        if (farmer.getRole() != UserRole.FARMER) {
            throw new BusinessException(ErrorCode.MATCHING_FORBIDDEN);
        }

        SpaceSummary space = spaceService.getSummaryById(request.getSpaceId()); // 미존재 시 SPACE_NOT_FOUND
        if (space.isDeleted()) {
            throw new BusinessException(ErrorCode.SPACE_NOT_FOUND);
        }
        if (space.getStatus() != SpaceStatus.AVAILABLE) {
            throw new BusinessException(ErrorCode.SPACE_NOT_AVAILABLE);
        }
        if (space.getOwnerId().equals(userId)) {
            throw new BusinessException(ErrorCode.MATCHING_SELF_APPLY);
        }
        if (matchingRepository.existsBySpaceIdAndFarmerIdAndStatus(
                space.getId(), userId, MatchingStatus.REQUESTED)) {
            throw new BusinessException(ErrorCode.MATCHING_DUPLICATED);
        }

        Matching matching = Matching.builder()
                .space(entityManager.getReference(Space.class, space.getId()))
                .farmer(farmer)
                .message(request.getMessage())
                .build();
        matchingRepository.save(matching);

        return MatchingApplyResponse.of(matching, space.getOwnerId());
    }
}
