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
  startDate: null,
  endDate: null,
  ownerAgreed: false,
  farmerAgreed: false,
  status: 'DRAFT',
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
  // 서버와 같은 규칙: 조건이 바뀌면 이미 받은 동의를 지웁니다.
  mockContract = {
    ...mockContract,
    ...input,
    ownerAgreed: false,
    farmerAgreed: false,
    status: 'DRAFT',
  };
  return readMockContract(matchingId);
}

export function agreeMockContract(matchingId: number): ContractDetail {
  const agreed =
    mockContract.viewerRole === 'OWNER' ? { ownerAgreed: true } : { farmerAgreed: true };
  const next = { ...mockContract, ...agreed };
  mockContract = {
    ...next,
    status: next.ownerAgreed && next.farmerAgreed ? 'CONFIRMED' : 'DRAFT',
  };
  return readMockContract(matchingId);
}

export function cancelMockContract(matchingId: number): ContractDetail {
  mockContract = { ...mockContract, status: 'CANCELED' };
  return readMockContract(matchingId);
}
