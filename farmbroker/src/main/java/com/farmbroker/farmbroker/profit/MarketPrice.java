package com.farmbroker.farmbroker.profit;

import java.time.LocalDate;

// 수익 계산에 투입되는 kg당 판매 단가와 그 출처 정보.
// 화면이 "언제 기준, 어디서 온 값인지"를 함께 보여줄 수 있도록 기준일·출처·stale을 같이 전달한다.
// stale=true는 실시간 시세 연동 후 갱신이 밀린 값을 뜻한다(SEED 기준값은 항상 false).
public record MarketPrice(
        double pricePerKgKrw,
        LocalDate basisDate,
        PriceSource source,
        boolean stale) {

    public static MarketPrice seed(double pricePerKgKrw, LocalDate basisDate) {
        return new MarketPrice(pricePerKgKrw, basisDate, PriceSource.SEED, false);
    }
}
