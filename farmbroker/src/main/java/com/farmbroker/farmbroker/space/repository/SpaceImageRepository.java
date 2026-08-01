package com.farmbroker.farmbroker.space.repository;

import com.farmbroker.farmbroker.space.domain.SpaceImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SpaceImageRepository extends JpaRepository<SpaceImage, Long> {

    // 상세 조회용 — 한 공간의 전체 이미지 (sortOrder 오름차순, 0번 = 대표)
    List<SpaceImage> findBySpaceIdOrderBySortOrderAsc(Long spaceId);

    // 목록/배치 조회용 — 여러 공간의 이미지를 한 번에 가져와 N+1을 방지한다
    List<SpaceImage> findBySpaceIdInOrderBySortOrderAsc(List<Long> spaceIds);

    // 이미지 전체 교체(replace) 시 기존 이미지 삭제. 쓰기 트랜잭션 안에서만 호출할 것
    void deleteBySpaceId(Long spaceId);
}
