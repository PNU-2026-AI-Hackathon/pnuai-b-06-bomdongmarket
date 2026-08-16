package com.farmbroker.farmbroker.user.dto;

public record WithdrawalEligibilityResponse(
        boolean withdrawable,
        long activeContractCount,
        String reason
) {
    public static WithdrawalEligibilityResponse from(long activeContractCount) {
        boolean withdrawable = activeContractCount == 0;
        return new WithdrawalEligibilityResponse(
                withdrawable,
                activeContractCount,
                withdrawable ? null : "ACTIVE_CONTRACT_EXISTS");
    }
}
