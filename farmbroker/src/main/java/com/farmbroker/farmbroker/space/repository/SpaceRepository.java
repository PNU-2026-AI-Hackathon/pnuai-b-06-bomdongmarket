package com.farmbroker.farmbroker.space.repository;

import com.farmbroker.farmbroker.space.domain.Space;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

// Space 조회는 공개 API 기준으로 deleted=false 조건을 기본 포함한다.
// 예외: BE3 내부 인터페이스(getSummaryById 등)는 deleted 여부 무관하게 findById를 사용한다.
public interface SpaceRepository extends JpaRepository<Space, Long> {

    // 공개 상세 조회 — 삭제된 공간은 404 처리 대상
    Optional<Space> findByIdAndDeletedFalse(Long id);

    // 내가 등록한 공간 — status 무관 전부, 삭제 제외, 최신순
    List<Space> findByOwnerIdAndDeletedFalseOrderByCreatedAtDesc(Long ownerId);

    // 공개 목록 검색 — deleted=false && status=AVAILABLE 고정, 필터는 null이면 미적용 (명세 2.2).
    // keyword는 제목 또는 주소 부분 일치. 정렬은 Pageable의 Sort로 주입한다 (latest/area/rent 매핑은 서비스 책임)
    @Query("""
            select s from Space s
            where s.deleted = false
              and s.status = com.farmbroker.farmbroker.space.domain.SpaceStatus.AVAILABLE
              and (:keyword is null
                   or s.title like concat('%', :keyword, '%')
                   or s.address like concat('%', :keyword, '%'))
              and (:minArea is null or s.area >= :minArea)
              and (:maxRent is null or s.monthlyRent <= :maxRent)
            """)
    Page<Space> search(@Param("keyword") String keyword,
                       @Param("minArea") BigDecimal minArea,
                       @Param("maxRent") Integer maxRent,
                       Pageable pageable);
}
