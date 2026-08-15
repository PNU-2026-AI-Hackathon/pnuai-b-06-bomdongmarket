import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

import { ApiError } from '@/api/client';
import { useAuth } from '@/auth/authContext';
import { ROUTES } from '@/constants/routes';
import { getWithdrawalEligibility } from '@/services/userService';
import type { WithdrawalEligibility } from '@/types/api';

export function useWithdrawal() {
  const { withdraw } = useAuth();
  const navigate = useNavigate();
  const [eligibility, setEligibility] = useState<WithdrawalEligibility | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [agreement, setAgreement] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [agreementError, setAgreementError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [wasBlockedDuringWithdrawal, setWasBlockedDuringWithdrawal] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const loadEligibility = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      setEligibility(await getWithdrawalEligibility());
    } catch {
      setEligibility(null);
      setLoadError('회원 탈퇴 가능 여부를 확인하지 못했습니다. 다시 시도해 주세요.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadEligibility();
  }, [loadEligibility]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isWithdrawing) return;

    const nextPasswordError = currentPassword
      ? null
      : '현재 비밀번호를 입력해 주세요.';
    const nextAgreementError = agreement
      ? null
      : '탈퇴 내용을 확인하고 동의해 주세요.';
    setPasswordError(nextPasswordError);
    setAgreementError(nextAgreementError);
    setFormError(null);
    if (nextPasswordError || nextAgreementError) return;

    setIsWithdrawing(true);
    try {
      await withdraw({ currentPassword, agreement: true });
      navigate(ROUTES.home, {
        replace: true,
        state: { withdrawalCompleted: true },
      });
    } catch (error) {
      if (error instanceof ApiError && error.errorCode === 'INVALID_CURRENT_PASSWORD') {
        setPasswordError('현재 비밀번호가 일치하지 않습니다.');
      } else if (
        error instanceof ApiError &&
        error.errorCode === 'ACTIVE_CONTRACT_EXISTS'
      ) {
        setWasBlockedDuringWithdrawal(true);
        setEligibility({
          withdrawable: false,
          activeContractCount: 1,
          reason: 'ACTIVE_CONTRACT_EXISTS',
        });
      } else {
        setFormError('회원 탈퇴를 완료하지 못했습니다. 잠시 후 다시 시도해 주세요.');
      }
    } finally {
      setIsWithdrawing(false);
    }
  }

  return {
    agreement,
    agreementError,
    currentPassword,
    eligibility,
    formError,
    handleSubmit,
    isLoading,
    isWithdrawing,
    loadEligibility,
    loadError,
    passwordError,
    setAgreement: (checked: boolean) => {
      setAgreement(checked);
      setAgreementError(null);
      setFormError(null);
    },
    setCurrentPassword: (value: string) => {
      setCurrentPassword(value);
      setPasswordError(null);
      setFormError(null);
    },
    wasBlockedDuringWithdrawal,
  };
}
