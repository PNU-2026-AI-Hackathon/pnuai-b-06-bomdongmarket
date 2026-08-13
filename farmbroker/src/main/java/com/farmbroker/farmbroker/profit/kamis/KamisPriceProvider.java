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
// 조사일이 오래된 값은 버리지 않고 stale로 표시해 그대로 쓴다 —
// 값이 널뛰는 것보다 조금 지난 실제 시세가 낫다는 판단이고, 화면이 기준일을 함께 보여 준다.
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
                .map(snapshot -> new MarketPrice(
                        snapshot.getPricePerKgKrw(),
                        snapshot.getSurveyedOn(),
                        PriceSource.KAMIS,
                        isStale(snapshot.getSurveyedOn())));
    }

    private boolean matchesCurrentCriteria(MarketPriceSnapshot snapshot) {
        return snapshot.getSaleType() != null
                && snapshot.getGrade() != null
                && properties.saleType().equals(snapshot.getSaleType())
                && properties.normalizedRegion().equals(KamisProperties.normalizeRegion(snapshot.getRegion()))
                && properties.grade().equals(snapshot.getGrade());
    }

    private boolean isStale(LocalDate surveyedOn) {
        return surveyedOn.isBefore(LocalDate.now(properties.zone()).minusDays(properties.freshnessDays()));
    }
}
