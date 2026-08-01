package com.farmbroker.farmbroker.matching.repository;

import com.farmbroker.farmbroker.matching.domain.Matching;
import com.farmbroker.farmbroker.matching.domain.MatchingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

// 매칭 신청 레포지토리.
// - existsBySpaceIdAndFarmerIdAndStatus: 같은 공간에 대한 본인의 REQUESTED 중복 신청 차단용.
//   MySQL은 부분 유니크 인덱스를 지원하지 않아 DB 제약 대신 서비스 레이어에서 이 체크로 방지한다.
// - findAllReceivedByOwnerId: space·farmer를 fetch join으로 함께 로딩해 목록 응답 조립 시 N+1을 막는다.
public interface MatchingRepository extends JpaRepository<Matching, Long> {

    boolean existsBySpaceIdAndFarmerIdAndStatus(Long spaceId, Long farmerId, MatchingStatus status);

    // 내가 farmer로서 신청한 목록 — 공간 정보는 getSummariesByIds(공간 계약) 배치로 별도 조회
    List<Matching> findAllByFarmerIdOrderByCreatedAtDesc(Long farmerId);

    // 내가 owner인 공간들에 들어온 신청 목록
    @Query("SELECT m FROM Matching m JOIN FETCH m.space s JOIN FETCH m.farmer " +
            "WHERE s.owner.id = :ownerId ORDER BY m.createdAt DESC")
    List<Matching> findAllReceivedByOwnerId(@Param("ownerId") Long ownerId);

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
}
