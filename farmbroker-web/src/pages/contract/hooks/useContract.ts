import { useCallback, useEffect, useRef, useState } from 'react';

import { ApiError } from '@/api/client';
import {
  agreeContract,
  cancelContract,
  getContract,
  saveContractTerms,
} from '@/services/contractService';
import type { ContractDetail, ContractTermsInput } from '@/types/api';
import type { AsyncStatus } from '@/types/common';

// 계약서 한 장을 로드하고 저장·동의·취소 action을 제공합니다.
// 세 action 모두 갱신된 계약서 전체를 응답으로 받으므로 재조회 없이 상태를 교체합니다.
export function useContract(matchingId: number) {
  const [contract, setContract] = useState<ContractDetail | null>(null);
  const [status, setStatus] = useState<AsyncStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState<AsyncStatus>('idle');
  const [actionError, setActionError] = useState<string | null>(null);
  // 확인 팝업을 거치더라도 더블 클릭·엔터 연타로 두 번 제출될 수 있어 ref로 막습니다.
  const isRunning = useRef(false);

  const load = useCallback(async () => {
    setStatus('loading');
    setError(null);

    try {
      setContract(await getContract(matchingId));
      setStatus('success');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '계약서를 불러오지 못했습니다.');
      setStatus('error');
    }
  }, [matchingId]);

  useEffect(() => {
    void load();
  }, [load]);

  // 저장·동의·취소는 호출과 실패 문구만 다르고 흐름이 같아 한 곳에서 처리합니다.
  const run = useCallback(
    async (action: () => Promise<ContractDetail>, failureMessage: string) => {
      if (isRunning.current) return false;

      isRunning.current = true;
      setActionStatus('loading');
      setActionError(null);
      try {
        setContract(await action());
        setActionStatus('success');
        return true;
      } catch (caught) {
        setActionError(caught instanceof Error ? caught.message : failureMessage);
        setActionStatus('error');
        // 409는 화면이 서버보다 오래됐다는 뜻(조건이 바뀌었거나 상대가 이미 확정·취소함)이라 값을 다시 받아 옵니다.
        // reload()가 아니라 여기서 직접 받는 이유: 로딩 화면으로 넘어가면 방금 띄운 안내 문구가 사라집니다.
        if (caught instanceof ApiError && caught.status === 409) {
          try {
            setContract(await getContract(matchingId));
          } catch {
            // 재조회까지 실패하면 기존 화면을 그대로 두고 문구만 남깁니다.
          }
        }
        return false;
      } finally {
        isRunning.current = false;
      }
    },
    [matchingId],
  );

  const save = useCallback(
    (input: ContractTermsInput) =>
      run(() => saveContractTerms(matchingId, input), '계약 조건을 저장하지 못했습니다.'),
    [matchingId, run],
  );

  // 지금 화면에 그려진 조건의 번호를 함께 보냅니다 — 그 사이 조건이 바뀌었으면 서버가 409로 거절합니다.
  const agree = useCallback(
    () =>
      contract
        ? run(() => agreeContract(matchingId, contract.termsVersion), '계약에 동의하지 못했습니다.')
        : Promise.resolve(false),
    [contract, matchingId, run],
  );

  const cancel = useCallback(
    () => run(() => cancelContract(matchingId), '계약을 취소하지 못했습니다.'),
    [matchingId, run],
  );

  return {
    contract,
    status,
    error,
    isSubmitting: actionStatus === 'loading',
    actionError,
    reload: load,
    save,
    agree,
    cancel,
  };
}
