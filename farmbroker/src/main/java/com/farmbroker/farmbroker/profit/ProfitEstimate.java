package com.farmbroker.farmbroker.profit;

// 수익 계산기 결과 — 월평균(연간 시나리오 평균) 기준.
// basis(면적·다단·전력) 필드를 함께 담아 프론트가 "무엇을 근거로 계산했는지"를 보여줄 수 있게 한다.
// 모든 금액은 KRW/월, 에너지는 kWh/월, 면적은 ㎡.
public record ProfitEstimate(
        String cropName,

        // ── 계산 근거(가정 포함) ──
        double totalAreaM2,
        double cultivableRatio,        // 재배 가능 바닥 비율(가정)
        int moduleLayers,              // 다단 재배대 층 수(가정)
        double ceilingHeightM,         // 천장고(가정)
        double availableFloorAreaM2,   // = 전체면적 × 재배가능비율
        double cultivationAreaM2,      // = 사용가능바닥 × 다단 층수
        double lightingPowerW,         // 조명 정격 전력
        double averageMonthlyEnergyKwh,// 월평균 환경제어 전력량

        // ── 생산·매출 ──
        double monthlyTotalProductionKg,
        double monthlySalesKg,
        double pricePerKgKrw,
        double monthlyRevenueKrw,

        // ── 비용 ──
        double electricityCostKrw,
        double waterCostKrw,
        double materialCostKrw,
        double laborCostKrw,
        double depreciationAndOtherCostKrw,
        double monthlyOperatingCostKrw,

        // ── 손익·배분·계약 추천 ──
        double monthlyOperatingProfitKrw,
        double landlordShareRatio,
        double landlordExpectedIncomeKrw,
        double desiredMonthlyRentKrw,
        double rentIncomeDifferenceKrw,
        double businessOperatingProfitKrw,
        boolean operatingLoss,
        boolean longTermRecommended,
        String recommendation,
        String contractType) {
}
