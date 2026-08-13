package com.farmbroker.farmbroker.profit;

import java.util.Optional;

// 판매 단가 조회 계약.
// 현재 구현은 작물 백과사전 기준값을 쓰는 SeedPriceProvider 하나뿐이고,
// KAMIS(농산물유통정보) 일별 시세를 배치 적재하면 같은 계약으로 구현체만 교체·우선순위 조합한다.
// 요청마다 외부 API를 호출하지 않는 것이 전제 — 시세는 배치로 적재한 뒤 이 계약으로 읽는다.
public interface MarketPriceProvider {

    // 작물명에 해당하는 단가. 알 수 없는 작물이면 Optional.empty()
    Optional<MarketPrice> findByCropName(String cropName);
}
