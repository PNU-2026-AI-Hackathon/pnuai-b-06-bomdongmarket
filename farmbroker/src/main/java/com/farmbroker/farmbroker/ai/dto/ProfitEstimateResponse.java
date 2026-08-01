package com.farmbroker.farmbroker.ai.dto;

import com.farmbroker.farmbroker.profit.ProfitEstimate;
import io.swagger.v3.oas.annotations.media.Schema;

// 예상 수익 계산 결과 응답 DTO (월평균 기준).
// 값은 Gemini가 아니라 서버의 결정론적 수익 계산기(ProfitCalculator)가 산출한다.
// basis 필드(면적 활용률·다단 단수·전력 등)를 함께 담아 화면이 계산 근거를 방어적으로 노출할 수 있게 한다.
// 금액은 KRW/월(반올림 정수), 면적은 ㎡, 전력량은 kWh/월.
@Schema(description = "서버 계산 예상 수익(월평균). 표준 가정값 기반의 추정치이며 실제와 다를 수 있음")
public record ProfitEstimateResponse(
        @Schema(description = "계산 대상 작물명", example = "상추") String cropName,

        // ── 계산 근거(가정 포함) ──
        @Schema(description = "공간 전체 면적(㎡)", example = "66.0") double totalAreaM2,
        @Schema(description = "재배 가능 바닥 비율 가정(0~1)", example = "0.6") double cultivableRatio,
        @Schema(description = "면적 활용률(%) = 재배가능비율×100", example = "60") int areaUtilizationPercent,
        @Schema(description = "다단 재배대 층 수 가정", example = "4") int moduleLayers,
        @Schema(description = "천장고 가정(m)", example = "2.5") double ceilingHeightM,
        @Schema(description = "재배 가능 바닥면적(㎡) = 전체면적×재배가능비율", example = "39.6") double availableFloorAreaM2,
        @Schema(description = "총 재배면적(㎡) = 바닥면적×다단 층수", example = "158.4") double cultivationAreaM2,
        @Schema(description = "조명 정격 전력(W)", example = "11316") long lightingPowerW,
        @Schema(description = "월평균 환경제어 전력량(kWh)", example = "9200") long averageMonthlyEnergyKwh,

        // ── 생산·매출 ──
        @Schema(description = "월 총생산량(kg)", example = "475") long monthlyTotalProductionKg,
        @Schema(description = "월 판매량(kg)", example = "427") long monthlySalesKg,
        @Schema(description = "kg당 판매단가(KRW)", example = "8000") long pricePerKgKrw,
        @Schema(description = "예상 월 매출(KRW)", example = "3420000") long monthlyRevenueKrw,

        // ── 비용 ──
        @Schema(description = "예상 월 전기비(KRW)", example = "1420000") long electricityCostKrw,
        @Schema(description = "예상 월 수도비(KRW)", example = "6000") long waterCostKrw,
        @Schema(description = "예상 월 재료비(KRW)", example = "1300000") long materialCostKrw,
        @Schema(description = "예상 월 인건비(KRW)", example = "2450000") long laborCostKrw,
        @Schema(description = "월 감가상각 등 기타비(KRW)", example = "100000") long depreciationAndOtherCostKrw,
        @Schema(description = "예상 월 운영비 합계(KRW)", example = "5276000") long monthlyOperatingCostKrw,

        // ── 손익·배분·계약 추천 ──
        @Schema(description = "예상 월 영업이익(KRW). 음수면 손실", example = "-1856000") long monthlyOperatingProfitKrw,
        @Schema(description = "공간 제공자 배분비율(0~1)", example = "0.8") double landlordShareRatio,
        @Schema(description = "공간 제공자 예상 배분수익(KRW)", example = "-1484000") long landlordExpectedIncomeKrw,
        @Schema(description = "공간 희망 월세(KRW). 배분수익과 비교 기준", example = "800000") long desiredMonthlyRentKrw,
        @Schema(description = "운영사 예상 영업이익(KRW)", example = "-371000") long businessOperatingProfitKrw,
        @Schema(description = "영업 손실 여부", example = "true") boolean operatingLoss,
        @Schema(description = "장기(스마트팜) 계약 추천 여부", example = "false") boolean longTermRecommended,
        @Schema(description = "계약형태 추천 문구", example = "개인취미 대여 방식 추천") String recommendation,
        @Schema(description = "추천 계약형태", example = "단기계약형") String contractType) {

    public static ProfitEstimateResponse from(ProfitEstimate e) {
        return new ProfitEstimateResponse(
                e.cropName(),
                round1(e.totalAreaM2()),
                e.cultivableRatio(),
                (int) Math.round(e.cultivableRatio() * 100),
                e.moduleLayers(),
                e.ceilingHeightM(),
                round1(e.availableFloorAreaM2()),
                round1(e.cultivationAreaM2()),
                Math.round(e.lightingPowerW()),
                Math.round(e.averageMonthlyEnergyKwh()),
                Math.round(e.monthlyTotalProductionKg()),
                Math.round(e.monthlySalesKg()),
                Math.round(e.pricePerKgKrw()),
                Math.round(e.monthlyRevenueKrw()),
                Math.round(e.electricityCostKrw()),
                Math.round(e.waterCostKrw()),
                Math.round(e.materialCostKrw()),
                Math.round(e.laborCostKrw()),
                Math.round(e.depreciationAndOtherCostKrw()),
                Math.round(e.monthlyOperatingCostKrw()),
                Math.round(e.monthlyOperatingProfitKrw()),
                e.landlordShareRatio(),
                Math.round(e.landlordExpectedIncomeKrw()),
                Math.round(e.desiredMonthlyRentKrw()),
                Math.round(e.businessOperatingProfitKrw()),
                e.operatingLoss(),
                e.longTermRecommended(),
                e.recommendation(),
                e.contractType());
    }

    private static double round1(double value) {
        return Math.round(value * 10.0) / 10.0;
    }
}
