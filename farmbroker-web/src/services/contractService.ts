import { apiRequest, USE_MOCKS } from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
import { mockDelay } from '@/mocks/handlers';
import {
  agreeMockContract,
  cancelMockContract,
  readMockContract,
  saveMockContractTerms,
} from '@/mocks/mockContract';
import type { ContractDetail, ContractTermsInput } from '@/types/api';

// 네 호출 모두 갱신된 계약서 전체를 돌려주므로 화면은 액션 뒤 재조회하지 않습니다.

export async function getContract(matchingId: number): Promise<ContractDetail> {
  if (!USE_MOCKS) {
    const response = await apiRequest<ContractDetail>(
      ENDPOINTS.matchings.contract(matchingId),
    );
    return response.data;
  }

  await mockDelay();
  return readMockContract(matchingId);
}

// 공간 제공자만 호출할 수 있습니다(권한 판정은 서버가 하고, 화면은 viewerRole로 버튼을 감춥니다).
export async function saveContractTerms(
  matchingId: number,
  input: ContractTermsInput,
): Promise<ContractDetail> {
  if (!USE_MOCKS) {
    const response = await apiRequest<ContractDetail>(
      ENDPOINTS.matchings.contract(matchingId),
      { method: 'PATCH', body: input },
    );
    return response.data;
  }

  await mockDelay();
  return saveMockContractTerms(matchingId, input);
}

// termsVersion은 사용자가 화면에서 본 조건의 번호입니다. 그 사이 조건이 바뀌었으면 서버가 409로 거절합니다.
export async function agreeContract(
  matchingId: number,
  termsVersion: number,
): Promise<ContractDetail> {
  if (!USE_MOCKS) {
    const response = await apiRequest<ContractDetail>(
      ENDPOINTS.matchings.contractAgree(matchingId),
      { method: 'PATCH', body: { termsVersion } },
    );
    return response.data;
  }

  await mockDelay();
  return agreeMockContract(matchingId, termsVersion);
}

export async function cancelContract(matchingId: number): Promise<ContractDetail> {
  if (!USE_MOCKS) {
    const response = await apiRequest<ContractDetail>(
      ENDPOINTS.matchings.contractCancel(matchingId),
      { method: 'PATCH' },
    );
    return response.data;
  }

  await mockDelay();
  return cancelMockContract(matchingId);
}
