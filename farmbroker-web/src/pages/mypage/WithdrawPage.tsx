import { AlertTriangle, ArrowLeft, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/common/Button';
import { buttonStyles } from '@/components/common/buttonStyles';
import { Card } from '@/components/common/Card';
import { ErrorState } from '@/components/common/ErrorState';
import { Input } from '@/components/common/Input';
import { LoadingState } from '@/components/common/LoadingState';
import { PageHeader } from '@/components/common/PageHeader';
import { PageContainer } from '@/components/layout/PageContainer';
import { ROUTES } from '@/constants/routes';
import { useWithdrawal } from '@/pages/mypage/hooks/useWithdrawal';

const withdrawalEffects = [
  '회원정보는 비식별화되며 기존 계정으로 다시 로그인할 수 없습니다.',
  '대기 중인 매칭 신청, 등록 공간, 찜는 정리됩니다.',
  '판매 중인 상품은 마켓에서 비공개 처리됩니다.',
  '구매 이력은 정산을 위해 비식별화된 계정과 연결해 보관됩니다.',
] as const;

export function WithdrawPage() {
  const {
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
    setAgreement,
    setCurrentPassword,
    wasBlockedDuringWithdrawal,
  } = useWithdrawal();

  return (
    <PageContainer narrow>
      <PageHeader
        action={
          <Link className={buttonStyles({ variant: 'ghost' })} to={ROUTES.myPage}>
            <ArrowLeft className="h-4 w-4" aria-hidden />
            마이페이지로
          </Link>
        }
        description="탈퇴 전 처리되는 정보와 진행 중인 계약 여부를 반드시 확인해 주세요."
        eyebrow="Withdrawal"
        title="회원 탈퇴"
      />

      <Card className="mt-6" padding="lg" variant="subtle">
        <section aria-labelledby="withdrawal-effects-title">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-app bg-feedback-danger-soft text-feedback-danger">
              <ShieldAlert className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <h2 className="font-bold text-content" id="withdrawal-effects-title">
                탈퇴하면 되돌릴 수 없습니다
              </h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-content-muted">
                {withdrawalEffects.map((effect) => (
                  <li key={effect}>{effect}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </Card>

      <div className="mt-6">
        {isLoading ? (
          <LoadingState label="회원 탈퇴 가능 여부를 확인하는 중입니다" />
        ) : loadError ? (
          <ErrorState
            message={loadError}
            onRetry={() => void loadEligibility()}
            title="탈퇴 가능 여부를 확인하지 못했습니다"
          />
        ) : eligibility && !eligibility.withdrawable ? (
          <Card padding="lg">
            <section aria-labelledby="withdrawal-blocked-title" aria-live="polite">
              <div className="flex items-start gap-3">
                <AlertTriangle
                  className="mt-0.5 h-6 w-6 shrink-0 text-feedback-danger"
                  aria-hidden
                />
                <div>
                  <h2 className="font-bold text-content" id="withdrawal-blocked-title">
                    진행 중인 계약이 있어 탈퇴할 수 없습니다
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-content-muted">
                    {wasBlockedDuringWithdrawal
                      ? '최종 확인 중 계약 상태가 변경되었습니다. 계약을 먼저 종료한 뒤 다시 시도해 주세요.'
                      : `현재 진행 중인 계약이 ${eligibility.activeContractCount}건 있습니다. 계약을 먼저 종료한 뒤 다시 시도해 주세요.`}
                  </p>
                  <Link
                    className={buttonStyles({
                      variant: 'outline',
                      className: 'mt-5 w-full sm:w-auto',
                    })}
                    to={ROUTES.dashboardApplications}
                  >
                    진행 중인 계약 확인
                  </Link>
                </div>
              </div>
            </section>
          </Card>
        ) : eligibility ? (
          <form noValidate onSubmit={(event) => void handleSubmit(event)}>
            <Card padding="lg">
              <h2 className="text-lg font-bold text-content">본인 확인</h2>
              <p className="mt-2 text-sm leading-6 text-content-muted">
                안전한 탈퇴를 위해 현재 비밀번호와 동의가 필요합니다.
              </p>

              {formError ? (
                <p
                  className="mt-5 rounded-app bg-feedback-danger-soft p-3 text-sm font-semibold text-feedback-danger"
                  role="alert"
                >
                  {formError}
                </p>
              ) : null}

              <div className="mt-5">
                <Input
                  autoComplete="current-password"
                  errorMessage={passwordError ?? undefined}
                  label="현재 비밀번호"
                  name="withdrawalPassword"
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  type="password"
                  value={currentPassword}
                />
              </div>

              <div className="mt-5">
                <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-app border border-line bg-surface p-3 text-sm text-content">
                  <input
                    aria-describedby={agreementError ? 'withdrawal-agreement-error' : undefined}
                    aria-invalid={agreementError ? true : undefined}
                    checked={agreement}
                    className="mt-0.5 h-5 w-5 shrink-0 accent-action"
                    name="withdrawalAgreement"
                    onChange={(event) => setAgreement(event.target.checked)}
                    type="checkbox"
                  />
                  <span>
                    위 안내를 확인했으며 회원 탈퇴 후 계정을 복구할 수 없다는 점에 동의합니다.
                  </span>
                </label>
                {agreementError ? (
                  <p
                    className="mt-1.5 text-xs font-medium text-feedback-danger"
                    id="withdrawal-agreement-error"
                    role="alert"
                  >
                    {agreementError}
                  </p>
                ) : null}
              </div>

              <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Link className={buttonStyles({ variant: 'outline' })} to={ROUTES.myPage}>
                  취소
                </Link>
                <Button disabled={isWithdrawing} type="submit" variant="danger">
                  {isWithdrawing ? '회원 탈퇴 중...' : '회원 탈퇴하기'}
                </Button>
              </div>
            </Card>
          </form>
        ) : null}
      </div>
    </PageContainer>
  );
}
