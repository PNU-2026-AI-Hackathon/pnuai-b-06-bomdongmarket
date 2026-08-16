package com.farmbroker.farmbroker.matching.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

// 계약 동의(PATCH /matchings/{id}/contract/agree) 요청 바디 DTO — 당사자 둘 다 보낸다.
// 동의자가 화면에서 본 조건의 번호(응답의 termsVersion)를 그대로 되돌려 보낸다.
// 이 값이 없으면 서버는 오래 열린 화면에서 온 동의를 지금 저장된 조건에 그대로 적용하게 된다.
@Getter
@NoArgsConstructor
public class ContractAgreeRequest {

    @NotNull(message = "조건 버전은 필수입니다.")
    private Integer termsVersion;
}
