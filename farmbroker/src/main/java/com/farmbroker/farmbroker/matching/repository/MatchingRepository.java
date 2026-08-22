package com.farmbroker.farmbroker.matching.repository;

import com.farmbroker.farmbroker.matching.domain.Matching;
import com.farmbroker.farmbroker.matching.domain.MatchingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

// 매칭 신청 레포지토리.
// - existsBySpaceIdAndFarmerIdAndStatus: 같은 공간에 대한 본인의 REQUESTED 중복 신청 차단용.
//   MySQL은 부분 유니크 인덱스를 지원하지 않아 DB 제약 대신 서비스 레이어에서 이 체크로 방지한다.
// - findAllReceivedByOwnerId: space·farmer를 fetch join으로 함께 로딩해 목록 응답 조립 시 N+1을 막는다.
public interface MatchingRepository extends JpaRepository<Matching, Long> {

    boolean existsBySpaceIdAndFarmerIdAndStatus(Long spaceId, Long farmerId, MatchingStatus status);

    // 공간 주인이 신청자에게 먼저 채팅을 걸 수 있는지 판단할 때 쓴다(chat 도메인).
    // 상태는 보지 않는다 — 협의가 끝난 뒤에도 이미 오간 대화는 이어갈 수 있어야 한다.
    boolean existsBySpaceIdAndFarmerId(Long spaceId, Long farmerId);

    // 채팅에서 계약으로 넘어가는 버튼을 그리려면 두 참여자 사이의 매칭을 알아야 한다.
    // 어느 쪽이 농부인지는 채팅 쪽에서 알 수 없어 두 사람의 id 를 함께 넘긴다.
    // 재신청으로 여러 건이 쌓일 수 있어 최근 것을 쓴다.
    List<Matching> findBySpaceIdInAndFarmerIdInOrderByCreatedAtDesc(
            Collection<Long> spaceIds, Collection<Long> farmerIds);

    // 내가 farmer로서 신청한 목록 — 공간 정보는 getSummariesByIds(공간 계약) 배치로 별도 조회
    List<Matching> findAllByFarmerIdOrderByCreatedAtDesc(Long farmerId);

    // 헤더의 보낸 신청 알림 목록 — 신청자가 치운 건만 제외한다.
    List<Matching> findAllByFarmerIdAndFarmerDismissedAtIsNullOrderByCreatedAtDesc(Long farmerId);

    // 특정 공간에 대한 내 신청만 — 신청 상세 화면(/spaces/{id}/apply)이 전체 목록을 받지 않도록
    List<Matching> findAllByFarmerIdAndSpaceIdOrderByCreatedAtDesc(Long farmerId, Long spaceId);

    // 내가 owner인 공간들에 들어온 신청 목록.
    // 소유자가 치운 건은 제외한다 — 목록과 대시보드 '받은 신청' 수가 이 쿼리 하나로 함께 맞춰진다.
    @Query("SELECT m FROM Matching m JOIN FETCH m.space s JOIN FETCH m.farmer " +
            "WHERE s.owner.id = :ownerId AND m.ownerDismissedAt IS NULL ORDER BY m.createdAt DESC")
    List<Matching> findAllReceivedByOwnerId(@Param("ownerId") Long ownerId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT m FROM Matching m WHERE m.id = :matchingId")
    Optional<Matching> findByIdForUpdate(@Param("matchingId") Long matchingId);

    @Query("SELECT m.farmer.id AS farmerId, s.owner.id AS ownerId, s.id AS spaceId " +
            "FROM Matching m JOIN m.space s WHERE m.id = :matchingId")
    Optional<MatchingParticipantProjection> findParticipantsById(@Param("matchingId") Long matchingId);

    // 수락 트랜잭션 마지막 단계: 같은 공간의 나머지 REQUESTED 신청을 벌크로 자동 거절.
    // flushAutomatically — 벌크 UPDATE 전에 수락 건의 변경(ACCEPTED)을 먼저 flush해 유실을 방지하고,
    // clearAutomatically — 벌크 UPDATE는 영속성 컨텍스트를 우회하므로 stale 엔티티를 비운다.
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("UPDATE Matching m " +
            "SET m.status = com.farmbroker.farmbroker.matching.domain.MatchingStatus.REJECTED, m.respondedAt = :now " +
            "WHERE m.space.id = :spaceId " +
            "AND m.status = com.farmbroker.farmbroker.matching.domain.MatchingStatus.REQUESTED " +
            "AND m.id <> :excludeId")
    int rejectRemainingRequested(@Param("spaceId") Long spaceId,
                                 @Param("excludeId") Long excludeId,
                                 @Param("now") LocalDateTime now);

    @Query("SELECT count(m) FROM Matching m JOIN m.space s " +
            "WHERE m.status = com.farmbroker.farmbroker.matching.domain.MatchingStatus.ACCEPTED " +
            "AND s.status = com.farmbroker.farmbroker.space.domain.SpaceStatus.MATCHED " +
            "AND (m.farmer.id = :userId OR s.owner.id = :userId)")
    long countActiveContractsByUserId(@Param("userId") Long userId);

    // 탈퇴와 매칭 수락이 같은 신청 행을 동시에 처리하지 않도록, 탈퇴 직전에 REQUESTED 행을 잠근다.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT m FROM Matching m JOIN m.space s " +
            "WHERE m.status = com.farmbroker.farmbroker.matching.domain.MatchingStatus.REQUESTED " +
            "AND (m.farmer.id = :userId OR s.owner.id = :userId)")
    List<Matching> findRequestedForWithdrawalByUserIdForUpdate(@Param("userId") Long userId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT m FROM Matching m JOIN m.space s " +
            "WHERE m.status = com.farmbroker.farmbroker.matching.domain.MatchingStatus.ACCEPTED " +
            "AND s.status = com.farmbroker.farmbroker.space.domain.SpaceStatus.MATCHED " +
            "AND (m.farmer.id = :userId OR s.owner.id = :userId)")
    List<Matching> findActiveContractsByUserIdForUpdate(@Param("userId") Long userId);

    @Modifying(flushAutomatically = true)
    @Query("UPDATE Matching m SET m.status = com.farmbroker.farmbroker.matching.domain.MatchingStatus.CANCELED, " +
            "m.respondedAt = :now WHERE m.farmer.id = :userId " +
            "AND m.status = com.farmbroker.farmbroker.matching.domain.MatchingStatus.REQUESTED")
    int cancelRequestedByFarmerId(@Param("userId") Long userId, @Param("now") LocalDateTime now);

    @Modifying(flushAutomatically = true)
    @Query("UPDATE Matching m SET m.status = com.farmbroker.farmbroker.matching.domain.MatchingStatus.REJECTED, " +
            "m.respondedAt = :now WHERE m.space.owner.id = :userId " +
            "AND m.status = com.farmbroker.farmbroker.matching.domain.MatchingStatus.REQUESTED")
    int rejectRequestedBySpaceOwnerId(@Param("userId") Long userId, @Param("now") LocalDateTime now);
}
