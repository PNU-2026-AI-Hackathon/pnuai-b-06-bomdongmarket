package com.farmbroker.farmbroker.crop.domain;

// 작물 데이터의 출처 구분.
// MVP는 직접 입력한 SEED 데이터로 시작하고,
// 이후 농촌진흥청 농사로(Nongsaro) 공공 API 배치 적재 시 NONGSARO로 확장한다.
public enum CropDataSource {
    SEED,
    NONGSARO
}
