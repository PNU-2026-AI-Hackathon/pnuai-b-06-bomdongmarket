package com.farmbroker.farmbroker.profit;

import com.farmbroker.farmbroker.profit.dto.ProfitEstimateRequest;
import com.farmbroker.farmbroker.profit.dto.ProfitEstimateResponse;
import com.farmbroker.farmbroker.profit.service.ProfitEstimateService;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

// 등록 전 수익 예측이 spaceId 없이 면적·월세만으로 동작하고,
// 공간 제공자 배분수익 내림차순으로 정렬되는지 검증한다.
class ProfitEstimateServiceTest {

    private static ProfitEstimateService service;

    @BeforeAll
    static void setUp() {
        ProfitReferenceData data = new ProfitReferenceData();
        data.load();
        service = new ProfitEstimateService(new ProfitCalculator(data));
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
