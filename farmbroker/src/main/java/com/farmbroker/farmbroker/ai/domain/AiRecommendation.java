package com.farmbroker.farmbroker.ai.domain;

import com.farmbroker.farmbroker.space.domain.Space;
import com.farmbroker.farmbroker.user.domain.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

// AI 추천 요청 1회 = 1행. 요청 입력값과 AI 응답(배치안/주의사항)을 함께 저장한다.
// 저장하는 이유: ① Gemini 장애/쿼터 초과 시 최근 결과 재사용(fallback) ② 반복 요청 캐시 활용 여지
// ③ 마이페이지 "내 추천 이력" 확장 대비. cautions는 문자열 배열이라 JSON 컬럼에 직렬화해 저장한다(MVP 비정규화).
@Entity
@Table(name = "ai_recommendations", indexes = {
        @Index(name = "idx_airec_space", columnList = "space_id, created_at")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class AiRecommendation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "space_id", nullable = false)
    private Space space;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(length = 30)
    private String preferredCrop;

    @Column(length = 100)
    private String purpose;

    @Column(length = 500)
    private String additionalInfo;

    @Column(columnDefinition = "TEXT")
    private String layoutSuggestion;

    @Column(columnDefinition = "json")
    private String cautionsJson;

    // 어떤 모델의 응답인지 추적 (모델 교체 시 이력 구분)
    @Column(nullable = false, length = 50)
    private String model;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // 추천 1건당 작물 2~3개 — display_order로 순서 보존, 저장은 cascade로 함께
    @OneToMany(mappedBy = "recommendation", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("displayOrder ASC")
    private List<RecommendedCrop> recommendedCrops = new ArrayList<>();

    @Builder
    public AiRecommendation(Space space, User user, String preferredCrop, String purpose,
                            String additionalInfo, String layoutSuggestion, String cautionsJson, String model) {
        this.space = space;
        this.user = user;
        this.preferredCrop = preferredCrop;
        this.purpose = purpose;
        this.additionalInfo = additionalInfo;
        this.layoutSuggestion = layoutSuggestion;
        this.cautionsJson = cautionsJson;
        this.model = model;
    }

    public void addRecommendedCrop(RecommendedCrop recommendedCrop) {
        recommendedCrops.add(recommendedCrop);
        recommendedCrop.assignRecommendation(this);
    }
}
