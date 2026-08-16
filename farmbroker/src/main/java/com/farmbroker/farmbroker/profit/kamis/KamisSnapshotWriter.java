package com.farmbroker.farmbroker.profit.kamis;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class KamisSnapshotWriter {

    private final MarketPriceSnapshotRepository snapshotRepository;

    @Transactional
    public void upsert(String cropName, KamisPriceClient.DailyPrice price,
                       String saleType, String region, String grade, LocalDateTime collectedAt) {
        String normalizedRegion = KamisProperties.normalizeRegion(region);
        snapshotRepository.findByCropName(cropName)
                .ifPresentOrElse(
                        snapshot -> snapshot.refresh(
                                price.pricePerKgKrw(), price.surveyedOn(), price.sampleCount(), collectedAt,
                                saleType, normalizedRegion, grade),
                        () -> snapshotRepository.save(new MarketPriceSnapshot(
                                cropName, price.pricePerKgKrw(), price.surveyedOn(), price.sampleCount(), collectedAt,
                                saleType, normalizedRegion, grade)));
    }
}
