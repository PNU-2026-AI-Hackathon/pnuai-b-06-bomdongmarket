package com.farmbroker.farmbroker.space.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

// 공간 이미지. 외부 스토리지/CDN URL 문자열만 저장한다 (파일 바이너리 저장 없음).
// sortOrder 0번이 대표 이미지(카드 썸네일). 수정 시 이미지는 전체 교체(replace) 방식이므로
// 개별 수정 메서드 없이 삭제 후 재등록한다. Space가 Soft Delete 되어도 이미지는 물리 삭제하지 않는다.
@Entity
@Table(name = "space_images", indexes = {
        @Index(name = "idx_space_image_space_id", columnList = "space_id")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class SpaceImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "space_id", nullable = false)
    private Space space;

    @Column(nullable = false, length = 500)
    private String imageUrl;

    // 노출 순서 (0부터). 0번 = 대표 이미지
    @Column(nullable = false)
    private int sortOrder;

    @Builder
    public SpaceImage(Space space, String imageUrl, int sortOrder) {
        this.space = space;
        this.imageUrl = imageUrl;
        this.sortOrder = sortOrder;
    }
}
