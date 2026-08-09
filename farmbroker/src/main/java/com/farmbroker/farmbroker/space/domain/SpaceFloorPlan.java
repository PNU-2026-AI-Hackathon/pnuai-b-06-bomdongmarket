package com.farmbroker.farmbroker.space.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

// 공간 도면. SpaceImage와 같은 구조지만 별도 테이블로 둔다 —
// 목록 카드의 대표 썸네일은 space_images의 sortOrder 0번을 쓰므로, 도면이 그 자리에 끼어들면 안 된다.
// 등록 시 최소 1장이 필수이며(SpaceCreateRequest), 수정 시에는 전체 교체(replace) 방식이다.
@Entity
@Table(name = "space_floor_plans", indexes = {
        @Index(name = "idx_space_floor_plan_space_id", columnList = "space_id")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class SpaceFloorPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "space_id", nullable = false)
    private Space space;

    @Column(nullable = false, length = 500)
    private String imageUrl;

    // 노출 순서 (0부터)
    @Column(nullable = false)
    private int sortOrder;

    @Builder
    public SpaceFloorPlan(Space space, String imageUrl, int sortOrder) {
        this.space = space;
        this.imageUrl = imageUrl;
        this.sortOrder = sortOrder;
    }
}
