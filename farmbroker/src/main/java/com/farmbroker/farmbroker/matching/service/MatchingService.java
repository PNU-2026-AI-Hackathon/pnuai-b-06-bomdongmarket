package com.farmbroker.farmbroker.matching.service;

import com.farmbroker.farmbroker.common.exception.BusinessException;
import com.farmbroker.farmbroker.common.exception.ErrorCode;
import com.farmbroker.farmbroker.matching.domain.Matching;
import com.farmbroker.farmbroker.matching.domain.MatchingStatus;
import com.farmbroker.farmbroker.matching.dto.MatchingApplyRequest;
import com.farmbroker.farmbroker.matching.dto.MatchingApplyResponse;
import com.farmbroker.farmbroker.matching.dto.MatchingStatusResponse;
import com.farmbroker.farmbroker.matching.dto.MyMatchingResponse;
import com.farmbroker.farmbroker.matching.dto.ReceivedMatchingResponse;
import com.farmbroker.farmbroker.matching.repository.MatchingRepository;
import com.farmbroker.farmbroker.space.domain.Space;
import com.farmbroker.farmbroker.space.domain.SpaceStatus;
import com.farmbroker.farmbroker.matching.support.SpaceSummary;
import com.farmbroker.farmbroker.matching.support.SpaceContractAdapter;
import com.farmbroker.farmbroker.user.domain.User;
import com.farmbroker.farmbroker.user.domain.UserRole;
import com.farmbroker.farmbroker.user.repository.UserRepository;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

// 매칭 신청/조회/수락/거절 비즈니스 로직.
// Space 접근은 협의된 내부 계약(getSummaryById 등 — 현재는 BE3 임시 SpaceContractAdapter)만 사용하고
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
    private final SpaceContractAdapter spaceContractAdapter; // BE2 SpaceService 계약 제공 시 교체
    private final EntityManager entityManager;

    @Transactional
    public MatchingApplyResponse apply(Long userId, MatchingApplyRequest request) {
        User farmer = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        if (farmer.getRole() != UserRole.FARMER) {
            throw new BusinessException(ErrorCode.MATCHING_FORBIDDEN);
        }

        SpaceSummary space = spaceContractAdapter.getSummaryById(request.getSpaceId()); // 미존재 시 SPACE_NOT_FOUND
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

    // 내가 farmer로서 신청한 목록. 공간 정보(제목/대표이미지/월세/소유자 닉네임)는
    // 매칭 건마다 단건 조회하면 N+1이 발생하므로 getSummariesByIds 배치 호출 1번으로 채운다.
    // 삭제된 공간도 Summary가 반환되므로(백엔드 2 계약) 이력에 그대로 노출된다.
    public List<MyMatchingResponse> getMyRequests(Long userId) {
        List<Matching> matchings = matchingRepository.findAllByFarmerIdOrderByCreatedAtDesc(userId);
        if (matchings.isEmpty()) {
            return List.of();
        }

        List<Long> spaceIds = matchings.stream()
                .map(m -> m.getSpace().getId()) // 프록시의 id 접근은 추가 SELECT를 유발하지 않는다
                .distinct()
                .toList();
        Map<Long, SpaceSummary> summaryBySpaceId = spaceContractAdapter.getSummariesByIds(spaceIds).stream()
                .collect(Collectors.toMap(SpaceSummary::getId, Function.identity()));

        return matchings.stream()
                .map(m -> MyMatchingResponse.of(m, summaryBySpaceId.get(m.getSpace().getId())))
                .toList();
    }

    // 내가 owner로서 소유한 공간들에 들어온 신청 목록 (space·farmer fetch join으로 로딩)
    public List<ReceivedMatchingResponse> getReceived(Long userId) {
        return matchingRepository.findAllReceivedByOwnerId(userId).stream()
                .map(ReceivedMatchingResponse::from)
                .toList();
    }

    // 수락 — 한 트랜잭션으로 ① 해당 매칭 ACCEPTED ② 공간 MATCHED 전환 ③ 나머지 REQUESTED 자동 REJECTED.
    // 공간 상태 전환은 백엔드 2 제공 markMatched()로만 수행(직접 UPDATE 금지) —
    // 내부에서 AVAILABLE·미삭제를 검증해 위반 시 SPACE_NOT_AVAILABLE(409)을 던지고 수락 전체가 롤백된다.
    @Transactional
    public MatchingStatusResponse accept(Long matchingId, Long userId) {
        Matching matching = getOwnedRequestedMatching(matchingId, userId);

        matching.accept();
        spaceContractAdapter.markMatched(matching.getSpace().getId());
        matchingRepository.rejectRemainingRequested(
                matching.getSpace().getId(), matching.getId(), LocalDateTime.now());

        return MatchingStatusResponse.from(matching);
    }

    // 거절 — 매칭 상태만 변경하고 공간 상태는 건드리지 않는다
    @Transactional
    public MatchingStatusResponse reject(Long matchingId, Long userId) {
        Matching matching = getOwnedRequestedMatching(matchingId, userId);
        matching.reject();
        return MatchingStatusResponse.from(matching);
    }

    // 수락/거절 공통 전제: 매칭 존재 → 공간 owner 본인 → 아직 REQUESTED 상태
    private Matching getOwnedRequestedMatching(Long matchingId, Long userId) {
        Matching matching = matchingRepository.findById(matchingId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MATCHING_NOT_FOUND));
        if (!matching.getSpace().getOwner().getId().equals(userId)) {
            throw new BusinessException(ErrorCode.MATCHING_FORBIDDEN);
        }
        if (matching.getStatus() != MatchingStatus.REQUESTED) {
            throw new BusinessException(ErrorCode.MATCHING_ALREADY_PROCESSED);
        }
        return matching;
    }
}
