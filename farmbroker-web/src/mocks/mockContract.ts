import { ApiError } from '@/api/client';
import type { ContractDetail, ContractTermsInput } from '@/types/api';

// 목업이 상태를 들고 있어야 "제공자가 저장하면 양측이 같은 값을 본다", "양측이 동의해야 확정된다" 같은
// 화면 전이를 실제 호출 없이 검증할 수 있습니다. 테스트 간 격리를 위해 resetMockContract를 씁니다.
const initialContract: ContractDetail = {
  matchingId: 1,
  spaceId: 1,
  address: '부산광역시 금정구 부산대학로 63번길 2',
  ownerNickname: '옥상건물주',
  farmerNickname: '도심농부',
  monthlyRent: null,
  maintenanceFee: null,
  maintenanceFeePayer: null,
  deposit: null,
  startDate: null,
  endDate: null,
  termsVersion: 0,
  ownerAgreed: false,
  farmerAgreed: false,
  canceledBy: null,
  status: 'REQUESTED',
  viewerRole: 'FARMER',
};

let mockContract: ContractDetail = { ...initialContract };

export function resetMockContract(overrides: Partial<ContractDetail> = {}) {
  mockContract = { ...initialContract, ...overrides };
}

export function readMockContract(matchingId: number): ContractDetail {
  return { ...mockContract, matchingId };
}

export function saveMockContractTerms(
  matchingId: number,
  input: ContractTermsInput,
): ContractDetail {
  // 서버와 같은 규칙: 조건이 바뀌면 이미 받은 동의를 지우고 조건 번호를 올립니다.
  mockContract = {
    ...mockContract,
    ...input,
    termsVersion: mockContract.termsVersion + 1,
    ownerAgreed: false,
    farmerAgreed: false,
    status: 'REQUESTED',
  };
  return readMockContract(matchingId);
}

export function agreeMockContract(matchingId: number, termsVersion: number): ContractDetail {
  // 서버와 같은 규칙: 동의자가 본 조건이 이미 바뀌었으면 409로 거절하고 재조회시킵니다.
  if (termsVersion !== mockContract.termsVersion) {
    throw new ApiError(
      '계약 조건이 변경되었습니다. 다시 확인해 주세요.',
      409,
      'CONTRACT_TERMS_CHANGED',
    );
  }

  const agreed =
    mockContract.viewerRole === 'OWNER' ? { ownerAgreed: true } : { farmerAgreed: true };
  const next = { ...mockContract, ...agreed };
  mockContract = {
    ...next,
    status: next.ownerAgreed && next.farmerAgreed ? 'ACCEPTED' : 'REQUESTED',
  };
  return readMockContract(matchingId);
}

export function cancelMockContract(matchingId: number): ContractDetail {
  // 서버와 같은 규칙: 취소를 누른 쪽을 함께 기록합니다.
  mockContract = {
    ...mockContract,
    status: 'REJECTED',
    canceledBy: mockContract.viewerRole,
  };
  return readMockContract(matchingId);
}
