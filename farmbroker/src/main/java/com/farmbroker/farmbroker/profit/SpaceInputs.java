package com.farmbroker.farmbroker.profit;

// 수익 계산기의 공간 입력값.
// DB Space에는 면적과 월세만 있어 나머지 재배 파라미터는 표준 가정값을 사용한다.
// 이 가정값들은 응답에 그대로 실어 화면에서 "예상 기준"으로 노출한다(방어적 표기).
public record SpaceInputs(
        double totalAreaM2,
        double cultivableRatio,
        int moduleLayers,
        double ceilingHeightM,
        double desiredMonthlyRentKrw) {

    // 표준 가정값 — 실측 데이터가 없을 때 사용. 화면 노출용으로 공개한다.
    public static final double DEFAULT_CULTIVABLE_RATIO = 0.6;   // 통로·설비 제외 재배 가능 바닥 비율
    public static final int DEFAULT_MODULE_LAYERS = 4;           // 다단 재배대 층 수
    public static final double DEFAULT_CEILING_HEIGHT_M = 2.5;   // 천장고

    // DB 공간 면적·월세 + 표준 가정값으로 입력을 구성한다.
    public static SpaceInputs fromSpace(double totalAreaM2, double desiredMonthlyRentKrw) {
        return new SpaceInputs(
                totalAreaM2,
                DEFAULT_CULTIVABLE_RATIO,
                DEFAULT_MODULE_LAYERS,
                DEFAULT_CEILING_HEIGHT_M,
                desiredMonthlyRentKrw);
    }
}
