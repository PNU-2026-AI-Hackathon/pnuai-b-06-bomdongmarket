package com.farmbroker.farmbroker.matching.dto;

import com.farmbroker.farmbroker.matching.domain.ContractParty;
import com.farmbroker.farmbroker.matching.domain.MaintenanceFeePayer;
import com.farmbroker.farmbroker.matching.domain.Matching;
import com.farmbroker.farmbroker.matching.domain.MatchingStatus;
import lombok.Getter;

import java.time.LocalDate;

// 계약서 화면 한 장을 그리는 데 필요한 전부(GET/PATCH /matchings/{id}/contract 공통 응답).
// 조회·저장·동의·취소가 모두 이 DTO를 돌려주므로 프론트는 액션 뒤 재조회할 필요가 없다.
// viewerRole은 요청자가 어느 쪽인지 서버가 판정해 내려준다 —
// 프론트가 userId와 당사자 id를 비교하는 로직을 들고 있지 않아도 입력 권한을 판단할 수 있다.
@Getter
public class ContractResponse {

    private final Long matchingId;
    private final Long spaceId;
    private final String address;
    private final String ownerNickname;
    private final String farmerNickname;
    private final Integer monthlyRent;
    private final Integer maintenanceFee;
    private final MaintenanceFeePayer maintenanceFeePayer;
    private final Integer deposit;
    private final LocalDate startDate;
    private final LocalDate endDate;
    // 지금 보고 있는 조건의 번호. 동의 요청에 그대로 실어 보내면 서버가 stale 동의를 걸러 낸다.
    private final int termsVersion;
    private final boolean ownerAgreed;
    private final boolean farmerAgreed;
    // 계약을 취소한 쪽. 취소 표시를 누른 사람에게만 붙이는 데 쓴다.
    // 취소 전이거나 확정에 밀려 자동 거절된 신청은 null이다.
    private final ContractParty canceledBy;
    private final MatchingStatus status;
    private final String viewerRole;

    private ContractResponse(Long matchingId, Long spaceId, String address,
                             String ownerNickname, String farmerNickname,
                             Integer monthlyRent, Integer maintenanceFee,
                             MaintenanceFeePayer maintenanceFeePayer, Integer deposit,
                             LocalDate startDate, LocalDate endDate, int termsVersion,
                             boolean ownerAgreed, boolean farmerAgreed,
                             ContractParty canceledBy,
                             MatchingStatus status, String viewerRole) {
        this.matchingId = matchingId;
        this.spaceId = spaceId;
        this.address = address;
        this.ownerNickname = ownerNickname;
        this.farmerNickname = farmerNickname;
        this.monthlyRent = monthlyRent;
        this.maintenanceFee = maintenanceFee;
        this.maintenanceFeePayer = maintenanceFeePayer;
        this.deposit = deposit;
        this.startDate = startDate;
        this.endDate = endDate;
        this.termsVersion = termsVersion;
        this.ownerAgreed = ownerAgreed;
        this.farmerAgreed = farmerAgreed;
        this.canceledBy = canceledBy;
        this.status = status;
        this.viewerRole = viewerRole;
    }

    // 이름과 주소는 입력받지 않고 기존 정보를 그대로 싣는다 —
    // 닉네임은 양측 User, 주소는 신청 대상 공간에서 읽는다(LAZY 접근은 트랜잭션 안에서만 안전).
    public static ContractResponse of(Matching matching, boolean isOwner) {
        return new ContractResponse(
                matching.getId(),
                matching.getSpace().getId(),
                matching.getSpace().getAddress(),
                matching.getSpace().getOwner().getNickname(),
                matching.getFarmer().getNickname(),
                matching.getContractMonthlyRent(),
                matching.getContractMaintenanceFee(),
                matching.getContractMaintenanceFeePayer(),
                matching.getContractDeposit(),
                matching.getContractStartDate(),
                matching.getContractEndDate(),
                matching.getTermsVersion(),
                matching.getOwnerAgreedAt() != null,
                matching.getFarmerAgreedAt() != null,
                matching.getContractCanceledBy(),
                matching.getStatus(),
                isOwner ? "OWNER" : "FARMER"
        );
    }
}
