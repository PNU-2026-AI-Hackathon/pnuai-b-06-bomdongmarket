import { ArrowLeft, CheckCircle2, Sprout } from 'lucide-react';
import { Link, Navigate, useLocation } from 'react-router-dom';

import { Button } from '@/components/common/Button';
import { buttonStyles } from '@/components/common/buttonStyles';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingState } from '@/components/common/LoadingState';
import { PageHeader } from '@/components/common/PageHeader';
import { PageContainer } from '@/components/layout/PageContainer';
import { ROUTES } from '@/constants/routes';
import { PredictionResultCard } from '@/pages/spaces/components/PredictionResultCard';
import { SpaceSummaryCard } from '@/pages/spaces/components/SpaceSummaryCard';
import { useSpaceRegistration } from '@/pages/spaces/hooks/useSpaceRegistration';
import type { SpaceCreateLocationState } from '@/pages/spaces/types';
import type { SpaceCreateInput } from '@/types/api';

// 공간 등록 폼에서 넘어온 입력값의 수익 예측을 보여주고 실제 등록을 확정하는 단계입니다.
export function SpacePredictionPage() {
  const location = useLocation();
  const state = location.state as SpaceCreateLocationState | null;

  // 새로고침이나 URL 직접 진입으로 입력값이 없으면 등록 폼부터 다시 시작합니다.
  if (!state?.input) {
    return <Navigate replace to={ROUTES.newSpace} />;
  }

  return <PredictionStep input={state.input} />;
}

interface PredictionStepProps {
  input: SpaceCreateInput;
}

function PredictionStep({ input }: PredictionStepProps) {
  const { estimates, predictionStatus, saveStatus, saveError, reloadPrediction, submit } =
    useSpaceRegistration(input);

  if (saveStatus === 'success') {
    return (
      <PageContainer narrow>
        <div className="mb-6">
          <PageHeader eyebrow="등록 완료" title="공간 등록이 완료되었습니다" />
        </div>
        <div
          className="rounded-app border border-line bg-feedback-success-soft p-5 text-content"
          role="status"
        >
          <CheckCircle2 className="h-8 w-8 text-feedback-success" aria-hidden />
          <h2 className="mt-3 text-lg font-bold">{input.title}</h2>
          <p className="mt-2 text-body-sm text-content-muted">
            등록한 공간은 도심 농부에게 노출되며 매칭 신청을 받을 수 있습니다.
          </p>
          <Link
            className={buttonStyles({ className: 'mt-5 w-full sm:w-auto' })}
            to={ROUTES.spaces}
          >
            <Sprout className="h-5 w-5" aria-hidden />
            등록한 공간 보러 가기
          </Link>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer narrow>
      <Link
        className={buttonStyles({ className: 'mb-5 -ml-3', size: 'sm', variant: 'ghost' })}
        state={{ input }}
        to={ROUTES.newSpace}
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        입력 정보 수정하기
      </Link>
      <div className="mb-6">
        <PageHeader
          description="아래 내용으로 등록하면 도심 농부에게 공간이 공개됩니다."
          eyebrow="수익 예측"
          title="예상 수익을 확인하고 등록하세요"
        />
      </div>

      <div className="grid gap-5">
        {predictionStatus === 'loading' || predictionStatus === 'idle' ? (
          <LoadingState label="수익 예측을 계산하는 중입니다" />
        ) : predictionStatus === 'error' ? (
          <ErrorState
            message="수익 예측을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."
            onRetry={() => void reloadPrediction()}
          />
        ) : (
          <PredictionResultCard estimates={estimates} />
        )}

        <SpaceSummaryCard input={input} />

        {saveError ? (
          <div
            className="rounded-app border border-feedback-danger-soft bg-feedback-danger-soft p-4 text-sm font-semibold text-feedback-danger"
            role="alert"
          >
            {saveError}
          </div>
        ) : null}

        <div className="sticky bottom-20 z-10 rounded-app border border-line bg-surface p-3 shadow-lift lg:static lg:p-0 lg:shadow-none">
          <Button
            className="w-full"
            disabled={saveStatus === 'loading'}
            onClick={() => void submit()}
          >
            {saveStatus === 'loading' ? '등록 중...' : '공간 등록'}
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}
