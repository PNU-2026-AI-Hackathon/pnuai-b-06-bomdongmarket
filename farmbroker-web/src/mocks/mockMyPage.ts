import type { WithdrawalEligibility } from '@/types/api';

export const MOCK_CURRENT_PASSWORD = 'password123';

export const mockWithdrawalEligibility: WithdrawalEligibility = {
  withdrawable: true,
  activeContractCount: 0,
  reason: null,
};

export const mockBlockedWithdrawalEligibility: WithdrawalEligibility = {
  withdrawable: false,
  activeContractCount: 1,
  reason: 'ACTIVE_CONTRACT_EXISTS',
};
