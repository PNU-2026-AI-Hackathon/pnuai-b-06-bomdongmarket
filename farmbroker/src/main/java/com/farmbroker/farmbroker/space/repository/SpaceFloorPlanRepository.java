package com.farmbroker.farmbroker.space.repository;

import com.farmbroker.farmbroker.space.domain.SpaceFloorPlan;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import org.springframework.data.jpa.repository.Query;

public interface SpaceFloorPlanRepository extends JpaRepository<SpaceFloorPlan, Long> {

    // 상세 조회용 — 한 공간의 전체 도면 (sortOrder 오름차순)
    List<SpaceFloorPlan> findBySpaceIdOrderBySortOrderAsc(Long spaceId);

    // 도면 전체 교체(replace) 시 기존 도면 삭제. 쓰기 트랜잭션 안에서만 호출할 것
    void deleteBySpaceId(Long spaceId);

    @Query("SELECT f.imageUrl FROM SpaceFloorPlan f")
    List<String> findAllImageUrls();
}
