package com.farmbroker.farmbroker.profit.service;

import com.farmbroker.farmbroker.profit.MarketPriceProvider;
import com.farmbroker.farmbroker.profit.ProfitCalculator;
import com.farmbroker.farmbroker.profit.ProfitEstimate;
import com.farmbroker.farmbroker.profit.SpaceInputs;
import com.farmbroker.farmbroker.profit.dto.ProfitEstimateRequest;
import com.farmbroker.farmbroker.profit.dto.ProfitEstimateResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;

// 등록 전 수익 예측 서비스.
// AI 추천(/ai/recommend)은 저장된 공간과 Gemini 작물 선택이 필요하지만 여기서는 둘 다 없으므로
// 계산기가 지원하는 모든 작물을 돌려 공간 제공자 배분수익이 큰 순으로 정렬해 돌려준다.
// 프론트는 첫 항목을 대표 작물로 쓰고 나머지는 비교안으로 보여준다.
@Service
@RequiredArgsConstructor
public class ProfitEstimateService {

    private final ProfitCalculator profitCalculator;
    private final MarketPriceProvider marketPriceProvider;

    public List<ProfitEstimateResponse> estimate(ProfitEstimateRequest request) {
        SpaceInputs inputs = SpaceInputs.fromSpace(
                request.getArea().doubleValue(),
                request.getMonthlyRent());

        // 재배 파라미터가 있어도 단가를 모르는 작물은 매출을 계산할 수 없으므로 목록에서 뺀다.
        // (단가 출처는 MarketPriceProvider가 정한다 — 백과사전 기준값, 이후 KAMIS 시세)
        return profitCalculator.supportedCrops().stream()
                .flatMap(cropName -> marketPriceProvider.findByCropName(cropName).stream()
                        .map(price -> profitCalculator.estimate(inputs, cropName, price)))
                .sorted(Comparator.comparingDouble(ProfitEstimate::landlordExpectedIncomeKrw).reversed())
                .map(ProfitEstimateResponse::from)
                .toList();
    }
}
