package com.farmbroker.farmbroker.profit;

import com.farmbroker.farmbroker.profit.dto.ProfitEstimateRequest;
import com.farmbroker.farmbroker.profit.dto.ProfitEstimateResponse;
import com.farmbroker.farmbroker.profit.service.ProfitEstimateService;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

// 등록 전 수익 예측이 spaceId 없이 면적·월세만으로 동작하고,
// 공간 제공자 배분수익 내림차순으로 정렬되는지 검증한다.
class ProfitEstimateServiceTest {

    private static ProfitEstimateService service;

    // 단가는 이제 계산기가 아니라 MarketPriceProvider가 공급한다.
    // 운영 구현(SeedPriceProvider)은 DB를 읽으므로, 단위 테스트에서는 같은 값을 주는 스텁을 쓴다.
    // 값은 작물 백과사전 시드와 동일하다 — Python 기준값과의 동등성을 유지하기 위함.
    private static final LocalDate BASIS = LocalDate.of(2026, 7, 4);
    private static final Map<String, Integer> SEED_PRICES =
            Map.of("상추", 8000, "바질", 20000, "딸기", 30000);

    @BeforeAll
    static void setUp() {
        ProfitReferenceData data = new ProfitReferenceData();
        data.load();
        MarketPriceProvider prices = cropName ->
                Optional.ofNullable(SEED_PRICES.get(cropName))
                        .map(price -> MarketPrice.seed(price, BASIS));
        service = new ProfitEstimateService(new ProfitCalculator(data), prices);
    }

    private static ProfitEstimateRequest request(double area, int monthlyRent) {
        ProfitEstimateRequest request = new ProfitEstimateRequest();
        ReflectionTestUtils.setField(request, "area", BigDecimal.valueOf(area));
        ReflectionTestUtils.setField(request, "monthlyRent", monthlyRent);
        return request;
    }

    @Test
    void returns_every_supported_crop_sorted_by_landlord_income() {
        List<ProfitEstimateResponse> results = service.estimate(request(164, 1_200_000));

        assertEquals(List.of("상추", "딸기", "바질").size(), results.size());
        for (int i = 1; i < results.size(); i++) {
            assertTrue(results.get(i - 1).landlordExpectedIncomeKrw()
                            >= results.get(i).landlordExpectedIncomeKrw(),
                    "배분수익 내림차순이어야 합니다");
        }
    }

    @Test
    void matches_python_reference_for_best_crop() {
        // ProfitCalculatorTest의 S001 기준값과 동일해야 한다 — 딸기가 배분수익 1위.
        ProfitEstimateResponse best = service.estimate(request(164, 1_200_000)).get(0);

        assertEquals("딸기", best.cropName());
        assertEquals(16_472_160L, best.monthlyRevenueKrw());
        assertEquals(3_424_966L, best.landlordExpectedIncomeKrw());
        assertEquals(1_200_000L, best.desiredMonthlyRentKrw());
        assertEquals("장기계약형", best.contractType());
    }

    @Test
    void carries_standard_assumptions_into_response() {
        ProfitEstimateResponse best = service.estimate(request(66, 500_000)).get(0);

        assertEquals(66.0, best.totalAreaM2());
        assertEquals(60, best.areaUtilizationPercent());
        assertEquals(4, best.moduleLayers());
        assertEquals(2.5, best.ceilingHeightM());
    }
}
