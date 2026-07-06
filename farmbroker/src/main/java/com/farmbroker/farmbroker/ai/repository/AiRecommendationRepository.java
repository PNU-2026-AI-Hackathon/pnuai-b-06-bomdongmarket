package com.farmbroker.farmbroker.ai.repository;

import com.farmbroker.farmbroker.ai.domain.AiRecommendation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

// AI 추천 이력 레포지토리.
// - findTopBySpaceIdOrderByCreatedAtDesc: Gemini 장애/쿼터 초과 시
//   같은 공간의 최근 저장 결과를 재사용하는 fallback 조회용.
public interface AiRecommendationRepository extends JpaRepository<AiRecommendation, Long> {

    Optional<AiRecommendation> findTopBySpaceIdOrderByCreatedAtDesc(Long spaceId);
}
