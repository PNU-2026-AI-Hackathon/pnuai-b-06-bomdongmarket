package com.farmbroker.farmbroker.ai.domain;

import com.farmbroker.farmbroker.crop.domain.Crop;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

// AI 추천 결과의 작물 항목 1개 = 1행.
// crop은 nullable FK — AI가 백과사전에 있는 작물을 추천하면 연결하고, 없는 작물이면 이름만 저장한다.
// 이 연결로 추천 결과 → 백과사전 상세로 바로 이동하는 UX가 가능해진다.
@Entity
@Table(name = "recommended_crops")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RecommendedCrop {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recommendation_id", nullable = false)
    private AiRecommendation recommendation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "crop_id")
    private Crop crop;

    @Column(nullable = false, length = 50)
    private String cropName;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String reason;

    @Column(nullable = false)
    private int displayOrder;

    @Builder
    public RecommendedCrop(Crop crop, String cropName, String reason, int displayOrder) {
        this.crop = crop;
        this.cropName = cropName;
        this.reason = reason;
        this.displayOrder = displayOrder;
    }

    // 연관관계 편의 메서드 — AiRecommendation.addRecommendedCrop에서만 호출한다
    void assignRecommendation(AiRecommendation recommendation) {
        this.recommendation = recommendation;
    }
}
