package com.farmbroker.farmbroker.profit;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

// 자바 포팅이 Python Profit_Calculator 0.3.1과 수치적으로 일치하는지 검증한다.
// 기준값: Python calculate_all_sites()의 S001-상추 / S001-딸기 시나리오.
// S001 입력(면적 164, 재배가능 0.6, 4단, 천장 2.5, 월세 1,200,000)은 SpaceInputs 기본 가정값과 동일하다.
class ProfitCalculatorTest {

    private static ProfitCalculator calculator;

    @BeforeAll
    static void setUp() {
        ProfitReferenceData data = new ProfitReferenceData();
        data.load();
        calculator = new ProfitCalculator(data);
    }

    private static void assertClose(double expected, double actual) {
        // 금액·에너지는 KRW/kWh 단위라 1e-3 절대오차면 충분(Python double과 동일 공식)
        assertEquals(expected, actual, Math.max(1e-3, Math.abs(expected) * 1e-9),
                "expected " + expected + " but got " + actual);
    }

    @Test
    void lettuce_matches_python_reference() {
        ProfitEstimate e = calculator.estimate(SpaceInputs.fromSpace(164, 1_200_000), "상추");

        assertClose(98.39999999999999, e.availableFloorAreaM2());
        assertClose(393.59999999999997, e.cultivationAreaM2());
        assertClose(1180.8, e.monthlyTotalProductionKg());
        assertClose(1062.72, e.monthlySalesKg());
        assertClose(8_501_760.0, e.monthlyRevenueKrw());
        assertClose(28114.285714285717, e.lightingPowerW());
        assertClose(22855.911681045367, e.averageMonthlyEnergyKwh());
        assertClose(3_542_666.310562032, e.electricityCostKrw());
        assertClose(14_216.750000000002, e.waterCostKrw());
        assertClose(3_251_999.9999999995, e.materialCostKrw());
        assertClose(6_092_928.0, e.laborCostKrw());
        assertClose(13_001_811.060562031, e.monthlyOperatingCostKrw());
        assertClose(-4_500_051.060562031, e.monthlyOperatingProfitKrw());
        assertClose(-3_600_040.848449625, e.landlordExpectedIncomeKrw());
        assertClose(-900_010.2121124063, e.businessOperatingProfitKrw());
        assertTrue(e.operatingLoss());
        assertFalse(e.longTermRecommended());
        assertEquals("단기계약형", e.contractType());
    }

    @Test
    void strawberry_matches_python_reference() {
        ProfitEstimate e = calculator.estimate(SpaceInputs.fromSpace(164, 1_200_000), "딸기");

        assertClose(16_472_160.0, e.monthlyRevenueKrw());
        assertClose(41252.06972313001, e.averageMonthlyEnergyKwh());
        assertClose(6_394_070.807085151, e.electricityCostKrw());
        assertClose(12_190_952.057085153, e.monthlyOperatingCostKrw());
        assertClose(4_281_207.942914847, e.monthlyOperatingProfitKrw());
        assertClose(3_424_966.354331878, e.landlordExpectedIncomeKrw());
        assertTrue(e.longTermRecommended());
        assertEquals("장기계약형", e.contractType());
    }
}
