package com.farmbroker.farmbroker.profit.kamis;

import com.farmbroker.farmbroker.profit.MarketPrice;
import com.farmbroker.farmbroker.profit.MarketPriceProvider;
import com.farmbroker.farmbroker.profit.PriceSource;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Optional;

// 수집해 둔 KAMIS 스냅샷을 읽어 단가로 내려준다. 외부 API를 직접 부르지 않는다.
// freshnessDays를 넘긴 조사값은 내려주지 않고 빈 값으로 떨어뜨린다 —
// 호출부(FallbackMarketPriceProvider)가 백과사전 표준 기준단가로 넘어간다.
// 오래된 시세를 계속 쓰는 것보다 검토해 둔 기준단가가 낫다는 팀 결정(#68 리뷰)이다.
@Component
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class KamisPriceProvider implements MarketPriceProvider {

    private final MarketPriceSnapshotRepository snapshotRepository;
    private final KamisProperties properties;

    @Override
    public Optional<MarketPrice> findByCropName(String cropName) {
        if (cropName == null || cropName.isBlank()) {
            return Optional.empty();
        }
        return snapshotRepository.findByCropName(cropName)
                // 출처를 증명할 기준이 없는 행을 현재 설정으로 추정하면 다른 기준의 시세가 섞여 남는다.
                .filter(this::matchesCurrentCriteria)
                .filter(snapshot -> isFresh(snapshot.getSurveyedOn()))
                .map(snapshot -> new MarketPrice(
                        snapshot.getPricePerKgKrw(),
                        snapshot.getSurveyedOn(),
                        PriceSource.KAMIS));
    }

    private boolean matchesCurrentCriteria(MarketPriceSnapshot snapshot) {
        return snapshot.getSaleType() != null
                && snapshot.getGrade() != null
                && properties.saleType().equals(snapshot.getSaleType())
                && properties.normalizedRegion().equals(KamisProperties.normalizeRegion(snapshot.getRegion()))
                && properties.grade().equals(snapshot.getGrade());
    }

    private boolean isFresh(LocalDate surveyedOn) {
        return !surveyedOn.isBefore(LocalDate.now(properties.zone()).minusDays(properties.freshnessDays()));
    }
}
