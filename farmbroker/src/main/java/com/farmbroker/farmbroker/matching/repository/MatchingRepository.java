package com.farmbroker.farmbroker.matching.repository;

import com.farmbroker.farmbroker.matching.domain.Matching;
import com.farmbroker.farmbroker.matching.domain.MatchingStatus;
import org.springframework.data.jpa.repository.JpaRepository;

// 매칭 신청 레포지토리.
// - existsBySpaceIdAndFarmerIdAndStatus: 같은 공간에 대한 본인의 REQUESTED 중복 신청 차단용.
//   MySQL은 부분 유니크 인덱스를 지원하지 않아 DB 제약 대신 서비스 레이어에서 이 체크로 방지한다.
public interface MatchingRepository extends JpaRepository<Matching, Long> {

    boolean existsBySpaceIdAndFarmerIdAndStatus(Long spaceId, Long farmerId, MatchingStatus status);
}
