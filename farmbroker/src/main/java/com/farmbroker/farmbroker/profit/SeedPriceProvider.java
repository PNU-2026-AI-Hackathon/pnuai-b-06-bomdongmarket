package com.farmbroker.farmbroker.profit;

import com.farmbroker.farmbroker.crop.repository.CropRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Optional;

// 작물 백과사전(crops.avg_price_per_kg)을 단일 가격 소스로 사용하는 기본 구현.
// 이전에는 수익 계산기 CSV(crop_sale_info)와 DB가 각각 단가를 들고 있어 값이 어긋났다
// (딸기 15,000 vs 30,000). 단가는 이제 DB 한 곳에서만 관리한다.
@Component
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SeedPriceProvider implements MarketPriceProvider {

    // 백과사전 기준 단가의 기준일 — 시드 데이터 작성 시점(실시간 시세 연동 전까지 고정)
    private static final LocalDate SEED_BASIS_DATE = LocalDate.of(2026, 7, 4);

    private final CropRepository cropRepository;

    @Override
    public Optional<MarketPrice> findByCropName(String cropName) {
        if (cropName == null || cropName.isBlank()) {
            return Optional.empty();
        }
        return cropRepository.findByName(cropName)
                .map(crop -> crop.getAvgPricePerKg())
                .filter(price -> price != null && price > 0)
                .map(price -> MarketPrice.seed(price, SEED_BASIS_DATE));
    }
}
