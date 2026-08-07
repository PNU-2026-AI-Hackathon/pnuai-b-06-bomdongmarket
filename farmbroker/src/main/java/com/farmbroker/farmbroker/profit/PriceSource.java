package com.farmbroker.farmbroker.profit;

// 수익 계산에 사용한 판매 단가의 출처.
// SEED  : 서버 작물 백과사전(crops)에 저장된 기준 단가
// KAMIS : 농산물유통정보(aT) 일별 시세를 배치 적재한 스냅샷 — 연동 시 추가
public enum PriceSource {
    SEED,
    KAMIS
}
