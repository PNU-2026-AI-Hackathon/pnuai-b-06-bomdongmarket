package com.farmbroker.farmbroker.ai.dto;

// 서비스 → 컨트롤러 반환 래퍼.
// fallback=true면 Gemini 장애(타임아웃/쿼터)로 이전 저장 결과를 재사용한 경우라
// 컨트롤러가 응답 message를 "이전 추천 결과를 표시합니다."로 바꿔 내려준다.
public record AiRecommendOutcome(AiRecommendResponse response, boolean fallback) {
}
