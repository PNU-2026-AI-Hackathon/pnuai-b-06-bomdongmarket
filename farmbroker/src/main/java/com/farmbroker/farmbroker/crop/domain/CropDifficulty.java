package com.farmbroker.farmbroker.crop.domain;

// 작물 재배 난이도. 목록 필터(difficulty 쿼리 파라미터)와 상세 응답에 그대로 노출된다.
public enum CropDifficulty {
    EASY,
    NORMAL,
    HARD
}
