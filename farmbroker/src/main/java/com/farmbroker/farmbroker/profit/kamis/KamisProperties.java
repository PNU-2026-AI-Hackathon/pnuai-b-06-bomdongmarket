package com.farmbroker.farmbroker.profit.kamis;

import org.springframework.boot.context.properties.ConfigurationProperties;

// KAMIS(공공데이터포털 일별 도·소매 가격정보) 수집 설정.
// 어떤 값을 대표 시세로 삼을지는 협의 중이라(#66) 코드에 박지 않고 설정으로 뺀다.
@ConfigurationProperties(prefix = "kamis")
public record KamisProperties(
        String serviceKey,
        String baseUrl,
        // 구분코드 — 01 소매, 02 중도매.
        // 소매가는 유통마진이 붙어 있어 재배자가 넘기는 값과 다르다(상추 기준 약 2배).
        String saleType,
        // 시군구명으로 거른다. 비우면 전국 조사를 모두 본다 —
        // 지역을 좁히면 하루 1건만 잡히는 작물이 있어 기본은 전국이다.
        String region,
        // 등급명. 등급마다 값이 달라 하나로 고정한다.
        String grade,
        // 조사일이 이 일수보다 오래되면 오래된 시세로 표시한다(계산에는 그대로 쓴다).
        int freshnessDays,
        // 한 번 수집할 때 거슬러 올라가 볼 일수. 주말·공휴일에는 조사가 없어 여유를 둔다.
        int lookbackDays,
        boolean enabled
) {
    public KamisProperties {
        if (baseUrl == null || baseUrl.isBlank()) {
            baseUrl = "https://apis.data.go.kr/B552845/perDay/price";
        }
        if (saleType == null || saleType.isBlank()) saleType = "02";
        if (grade == null || grade.isBlank()) grade = "상품";
        if (freshnessDays <= 0) freshnessDays = 7;
        if (lookbackDays <= 0) lookbackDays = 14;
    }

    public boolean usable() {
        return enabled && serviceKey != null && !serviceKey.isBlank();
    }
}
