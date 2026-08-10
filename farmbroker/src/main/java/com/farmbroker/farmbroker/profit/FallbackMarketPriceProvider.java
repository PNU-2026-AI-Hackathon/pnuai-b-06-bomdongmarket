package com.farmbroker.farmbroker.profit;

import com.farmbroker.farmbroker.profit.kamis.KamisPriceProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

import java.util.Optional;

// 단가 조회의 실제 진입점. 앞의 출처부터 차례로 물어보고 처음 값이 나오면 그걸 쓴다.
//
//   1) KAMIS 스냅샷 — 조사된 실제 시세. 오래된 값은 stale로 표시해 그대로 쓴다.
//   2) 작물 백과사전 기준값 — 시세를 못 받은 작물의 대체값.
//      비제철 작물은 조사 자체가 없어(예: 8월의 딸기) 이 단계가 반드시 필요하다.
//   3) 둘 다 없으면 빈 값 — 호출부가 그 작물을 계산 대상에서 뺀다.
//      추측한 숫자로 예상 수익을 만들지 않기 위함이다.
@Primary
@Component
@RequiredArgsConstructor
public class FallbackMarketPriceProvider implements MarketPriceProvider {

    private final KamisPriceProvider kamisPriceProvider;
    private final SeedPriceProvider seedPriceProvider;

    @Override
    public Optional<MarketPrice> findByCropName(String cropName) {
        Optional<MarketPrice> kamis = kamisPriceProvider.findByCropName(cropName);
        return kamis.isPresent() ? kamis : seedPriceProvider.findByCropName(cropName);
    }
}
