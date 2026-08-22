package com.farmbroker.farmbroker.matching.service;

import com.farmbroker.farmbroker.chat.service.ChatBlockService;
import com.farmbroker.farmbroker.common.exception.BusinessException;
import com.farmbroker.farmbroker.common.exception.ErrorCode;
import com.farmbroker.farmbroker.matching.domain.ContractParty;
import com.farmbroker.farmbroker.matching.domain.Matching;
import com.farmbroker.farmbroker.matching.domain.MatchingStatus;
import com.farmbroker.farmbroker.matching.dto.ContractResponse;
import com.farmbroker.farmbroker.matching.dto.ContractTermsRequest;
import com.farmbroker.farmbroker.matching.dto.MatchingApplyRequest;
import com.farmbroker.farmbroker.matching.dto.MatchingApplyResponse;
import com.farmbroker.farmbroker.matching.dto.MatchingStatusResponse;
import com.farmbroker.farmbroker.matching.dto.MyMatchingResponse;
import com.farmbroker.farmbroker.matching.dto.ReceivedMatchingResponse;
import com.farmbroker.farmbroker.matching.repository.MatchingRepository;
import com.farmbroker.farmbroker.matching.repository.MatchingParticipantProjection;
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

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

// 매칭 신청/조회/계약 협의 비즈니스 로직.
// Space 접근은 협의된 내부 계약(getSummaryById 등 — 현재는 BE3 임시 SpaceContractAdapter)만 사용하고
// SpaceRepository를 직접 주입하지 않는다 — 엔티티 연관관계 세팅에만 EntityManager.getReference로
// 프록시를 얻어 불필요한 SELECT 없이 FK만 저장한다.
// 매칭 신청에는 역할 제한이 없다 — FARMER를 요구하면 "농사를 지어야 농부가 되는데
// 농부가 아니면 신청을 못 하는" 순환이 생긴다. 대신 양측이 계약에 동의해 실제로 재배가 확정된 시점에
// 신청자에게 FARMER 역할을 부여한다.
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MatchingService {

    // 계약 시작일은 오늘을 가운데 둔 이 폭 안에서만 고를 수 있다 — 프론트 달력의 min/max와 같은 규칙이다.
    private static final int CONTRACT_START_WINDOW_WEEKS = 2;

    private final MatchingRepository matchingRepository;
    private final UserRepository userRepository;
    private final SpaceContractAdapter spaceContractAdapter; // BE2 SpaceService 계약 제공 시 교체
    private final ChatBlockService chatBlockService; // 차단 여부만 묻는다 — 차단 도메인은 chat 모듈이 갖는다
    private final EntityManager entityManager;

    @Transactional
    public MatchingApplyResponse apply(Long userId, MatchingApplyRequest request) {
        // 공간 소유권 변경 기능은 없으므로 초기 요약은 참여자 잠금 대상을 찾는 용도다.
        SpaceSummary initialSpace = spaceContractAdapter.getSummaryById(request.getSpaceId());
        User farmer = lockActiveParticipantPair(userId, initialSpace.getOwnerId());
        SpaceSummary space = spaceContractAdapter.getSummaryByIdForUpdate(request.getSpaceId());
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
        // 거절·취소된 뒤에는 다시 신청할 수 있다. 다시 받고 싶지 않으면 차단하면 된다 —
        // 차단이 채팅만 막는 표시가 아니라 거래를 거부하는 수단이 되도록 여기서 함께 본다.
        // 어느 쪽이 차단했든 막는다(내가 차단한 사람의 공간에 신청하는 것도 앞뒤가 맞지 않는다).
        if (chatBlockService.isBlockedEitherDirection(userId, space.getOwnerId())) {
            throw new BusinessException(ErrorCode.MATCHING_BLOCKED);
        }

        Matching matching = Matching.builder()
                .space(entityManager.getReference(Space.class, space.getId()))
                .farmer(farmer)
                .message(request.getMessage())
                .type(request.getType())
                .build();
        matchingRepository.save(matching);

        return MatchingApplyResponse.of(matching, space.getOwnerId());
    }

    // 내가 farmer로서 신청한 목록. 공간 정보(제목/대표이미지/월세/소유자 닉네임)는
    // 매칭 건마다 단건 조회하면 N+1이 발생하므로 getSummariesByIds 배치 호출 1번으로 채운다.
    // 삭제된 공간도 Summary가 반환되므로(백엔드 2 계약) 이력에 그대로 노출된다.
    // spaceId를 주면 해당 공간 건만 — 신청 상세 화면이 목록 전체를 받아 걸러내지 않도록 한다.
    public List<MyMatchingResponse> getMyRequests(Long userId, Long spaceId) {
        List<Matching> matchings = spaceId == null
                ? matchingRepository.findAllByFarmerIdOrderByCreatedAtDesc(userId)
                : matchingRepository.findAllByFarmerIdAndSpaceIdOrderByCreatedAtDesc(userId, spaceId);
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

    // 취소 — 신청자 본인이 아직 응답받지 않은 신청을 거둬들인다.
    // 공간 상태 롤백은 필요 없다: markMatched는 수락 시점에만 일어나고 취소는 REQUESTED에서만 허용된다.
    // 행을 지우지 않고 CANCELED로 남기므로 중복 신청 검사(REQUESTED만 확인)를 통과해 재신청이 가능하다.
    @Transactional
    public MatchingStatusResponse cancel(Long matchingId, Long userId) {
        Matching matching = matchingRepository.findById(matchingId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MATCHING_NOT_FOUND));
        if (!matching.getFarmer().getId().equals(userId)) {
            throw new BusinessException(ErrorCode.MATCHING_FORBIDDEN);
        }
        if (matching.getStatus() != MatchingStatus.REQUESTED) {
            throw new BusinessException(ErrorCode.MATCHING_ALREADY_PROCESSED);
        }

        matching.cancel();
        return MatchingStatusResponse.from(matching);
    }

    // 받은 목록에서 감추기 — 협의가 끝난 건만 대상이다.
    // 아직 협의 중인(REQUESTED) 신청은 계약 확정/취소로 처리해야 하므로 감출 수 없다.
    // 신청자 목록(my-requests)에는 그대로 남는다 — 소유자 화면에서만 사라진다.
    @Transactional
    public void dismissReceived(Long matchingId, Long userId) {
        Matching matching = matchingRepository.findById(matchingId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MATCHING_NOT_FOUND));
        if (!matching.getSpace().getOwner().getId().equals(userId)) {
            throw new BusinessException(ErrorCode.MATCHING_FORBIDDEN);
        }
        if (matching.getStatus() == MatchingStatus.REQUESTED) {
            throw new BusinessException(ErrorCode.MATCHING_NOT_PROCESSED);
        }

        matching.dismissByOwner();
    }

    // ── 계약서 ───────────────────────────────────────────────────────────────
    // 매칭 1건에 계약서 1건이 붙고, 계약 진행 상태는 매칭의 status가 그대로 나타낸다 —
    // REQUESTED(협의 중) → 양측 동의 시 ACCEPTED(확정) / 한쪽 취소 시 REJECTED.

    public ContractResponse getContract(Long matchingId, Long userId) {
        Matching matching = matchingRepository.findById(matchingId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MATCHING_NOT_FOUND));
        return ContractResponse.of(matching, isContractOwner(matching, userId));
    }

    // 조건 입력은 공간 제공자만 가능하다. 저장하면 양측 동의가 함께 초기화된다(Matching.updateContractTerms).
    @Transactional
    public ContractResponse updateContractTerms(Long matchingId, Long userId, ContractTermsRequest request) {
        Matching matching = getDraftContract(matchingId, userId);
        if (!isContractOwner(matching, userId)) {
            throw new BusinessException(ErrorCode.MATCHING_FORBIDDEN);
        }
        LocalDate today = LocalDate.now();
        LocalDate startDate = request.getStartDate();
        if (startDate.isBefore(today.minusWeeks(CONTRACT_START_WINDOW_WEEKS))
                || startDate.isAfter(today.plusWeeks(CONTRACT_START_WINDOW_WEEKS))) {
            throw new BusinessException(ErrorCode.CONTRACT_INVALID_START_DATE);
        }
        if (!request.getEndDate().isAfter(startDate)) {
            throw new BusinessException(ErrorCode.CONTRACT_INVALID_PERIOD);
        }

        matching.updateContractTerms(request.getMonthlyRent(), request.getMaintenanceFee(),
                request.getMaintenanceFeePayer(), request.getDeposit(),
                request.getStartDate(), request.getEndDate());
        return ContractResponse.of(matching, true);
    }

    // 계약 동의 — 양측이 모두 동의해야 확정(ACCEPTED)된다.
    // 조건이 비어 있으면 무엇에 동의하는지 알 수 없으므로 막는다.
    // 확정되면 한 트랜잭션으로 ① 매칭 ACCEPTED ② 공간 MATCHED 전환 ③ 신청자에게 FARMER 역할 부여
    // ④ 같은 공간의 나머지 REQUESTED 자동 REJECTED 까지 함께 처리한다.
    // 공간 상태 전환은 백엔드 2 제공 markMatched()로만 수행(직접 UPDATE 금지) —
    // 내부에서 AVAILABLE·미삭제를 검증해 위반 시 SPACE_NOT_AVAILABLE(409)을 던지고 확정 전체가 롤백된다.
    @Transactional
    public ContractResponse agreeContract(Long matchingId, Long userId, int termsVersion) {
        Matching matching = getDraftContract(matchingId, userId);
        // 동의자가 화면에서 본 조건과 지금 저장된 조건이 다르면 동의를 받지 않는다 —
        // 조회 → 소유자 수정 → 동의 순서는 저장 시 동의 초기화(updateContractTerms)만으로 막을 수 없어,
        // 본 적 없는 금액·기간으로 계약이 확정될 수 있다. 잠긴 행 기준으로 비교한다.
        if (matching.getTermsVersion() != termsVersion) {
            throw new BusinessException(ErrorCode.CONTRACT_TERMS_CHANGED);
        }
        if (!matching.hasContractTerms()) {
            throw new BusinessException(ErrorCode.CONTRACT_TERMS_REQUIRED);
        }

        boolean isOwner = isContractOwner(matching, userId);
        if (isOwner) {
            matching.agreeContractAsOwner();
        } else {
            matching.agreeContractAsFarmer();
        }

        boolean confirmed = matching.getOwnerAgreedAt() != null && matching.getFarmerAgreedAt() != null;
        if (confirmed) {
            // 상태만 바꾼다 — 영속성 컨텍스트를 건드리지 않아 아래 응답 조립이 그대로 안전하다.
            matching.accept();
        }
        // 응답을 여기서 조립한다 — 아래 벌크 UPDATE가 영속성 컨텍스트를 비우면
        // 그 뒤에는 space·farmer LAZY 프록시에서 닉네임·주소를 읽을 수 없다.
        ContractResponse response = ContractResponse.of(matching, isOwner);
        if (confirmed) {
            spaceContractAdapter.markMatched(matching.getSpace().getId());

            // 재배가 확정된 시점에 신청자가 농부가 된다 — 계약 취소에는 부여하지 않는다.
            // 반드시 아래 벌크 UPDATE보다 먼저 호출한다: rejectRemainingRequested의 clearAutomatically가
            // 영속성 컨텍스트를 비우면 아직 초기화되지 않은 farmer LAZY 프록시가 detached 되어
            // 초기화 시점에 LazyInitializationException이 나고, 예외를 피하더라도 더티 체킹이 유실된다.
            // 여기서 부여하면 flushAutomatically가 벌크 UPDATE 직전에 이 변경까지 함께 flush한다.
            matching.getFarmer().addRole(UserRole.FARMER);

            matchingRepository.rejectRemainingRequested(
                    matching.getSpace().getId(), matching.getId(), LocalDateTime.now());
        }
        return response;
    }

    // 계약 취소 — 둘 중 한 명만 눌러도 취소된다. 되돌릴 수 없다.
    // 상태 전이 외에 따르는 후속 처리가 없다(공간 상태는 확정 시점에만 바뀐다).
    @Transactional
    public ContractResponse cancelContract(Long matchingId, Long userId) {
        Matching matching = getDraftContract(matchingId, userId);
        boolean isOwner = isContractOwner(matching, userId);
        // 누가 눌렀는지 함께 남긴다 — 동의 현황에서 취소 표시를 누른 쪽에만 붙이는 근거다.
        matching.reject(isOwner ? ContractParty.OWNER : ContractParty.FARMER);
        return ContractResponse.of(matching, isOwner);
    }

    // 계약서 쓰기 공통 전제: 매칭 존재 → 당사자 본인 → 아직 협의 중(REQUESTED).
    // 양측이 동시에 '계약'을 눌러도 확정 판정이 어긋나지 않도록 행을 잠그고 읽는다.
    // 확정되면 사용자 역할과 공간 상태까지 바뀌므로 탈퇴와 같은 순서(사용자 → 공간 → 매칭)로 잠근다 —
    // 순서가 어긋나면 탈퇴 트랜잭션과 교착 상태에 빠진다.
    private Matching getDraftContract(Long matchingId, Long userId) {
        MatchingParticipantProjection participants = matchingRepository.findParticipantsById(matchingId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MATCHING_NOT_FOUND));
        lockActiveParticipantPair(participants.getOwnerId(), participants.getFarmerId());
        spaceContractAdapter.getSummaryByIdForUpdate(participants.getSpaceId());
        Matching matching = matchingRepository.findByIdForUpdate(matchingId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MATCHING_NOT_FOUND));
        requireContractParticipant(matching, userId);
        if (matching.getStatus() != MatchingStatus.REQUESTED) {
            throw new BusinessException(ErrorCode.CONTRACT_CLOSED);
        }
        return matching;
    }

    private boolean isContractOwner(Matching matching, Long userId) {
        requireContractParticipant(matching, userId);
        return matching.getSpace().getOwner().getId().equals(userId);
    }

    // 계약서는 당사자 둘만 볼 수 있다 — 월세·기간은 제3자에게 공개할 정보가 아니다.
    private void requireContractParticipant(Matching matching, Long userId) {
        boolean isOwner = matching.getSpace().getOwner().getId().equals(userId);
        boolean isFarmer = matching.getFarmer().getId().equals(userId);
        if (!isOwner && !isFarmer) {
            throw new BusinessException(ErrorCode.MATCHING_FORBIDDEN);
        }
    }

    private User lockActiveParticipantPair(Long targetUserId, Long otherUserId) {
        Long firstUserId = Math.min(targetUserId, otherUserId);
        Long secondUserId = Math.max(targetUserId, otherUserId);
        User firstUser = userRepository.findActiveByIdForUpdate(firstUserId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        if (!firstUserId.equals(secondUserId)) {
            User secondUser = userRepository.findActiveByIdForUpdate(secondUserId)
                    .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
            return targetUserId.equals(secondUserId) ? secondUser : firstUser;
        }
        return firstUser;
    }
}
