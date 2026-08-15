package com.farmbroker.farmbroker.profit;

import java.time.LocalDate;

// 수익 계산에 투입되는 kg당 판매 단가와 그 출처 정보.
// 화면이 "언제 기준, 어디서 온 값인지"를 함께 보여줄 수 있도록 기준일·출처를 같이 전달한다.
// 오래된 KAMIS 시세는 아예 내려오지 않고 SEED 기준단가로 대체되므로, 신선도 플래그는 두지 않는다.
public record MarketPrice(
        double pricePerKgKrw,
        LocalDate basisDate,
        PriceSource source) {

    public static MarketPrice seed(double pricePerKgKrw, LocalDate basisDate) {
        return new MarketPrice(pricePerKgKrw, basisDate, PriceSource.SEED);
    }
}
