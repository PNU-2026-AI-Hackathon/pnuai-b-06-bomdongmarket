import { ArrowLeft } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

import { useAuth } from '@/auth/authContext';
import { Card } from '@/components/common/Card';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingState } from '@/components/common/LoadingState';
import { PageHeader } from '@/components/common/PageHeader';
import { buttonStyles } from '@/components/common/buttonStyles';
import { PageContainer } from '@/components/layout/PageContainer';
import { ROUTES } from '@/constants/routes';
import { AppliedSpaceSummary } from '@/pages/space-apply/components/AppliedSpaceSummary';
import { ApplicationForm } from '@/pages/space-apply/components/ApplicationForm';
import { ApplicationStatusPanel } from '@/pages/space-apply/components/ApplicationStatusPanel';
import { useSpaceApplication } from '@/pages/space-apply/hooks/useSpaceApplication';

// 공간 하나에 대한 매칭 신청 화면입니다.
// 아직 신청 전이면 작성 폼을, 신청한 뒤에는 상태와 취소 경로를 같은 자리에 보여줍니다.
export function SpaceApplyPage() {
  const params = useParams();
  const spaceId = Number(params.spaceId);
  const { user } = useAuth();
  const { space, application, status, error, actionStatus, actionError, reload, submit, cancel } =
    useSpaceApplication(spaceId);
  const isOwnSpace = Boolean(space && user && space.owner.userId === user.userId);

  return (
    <PageContainer>
      <Link
        className={buttonStyles({
          className: '-ml-3 mb-5',
          size: 'sm',
          variant: 'ghost',
        })}
        to={ROUTES.spaceDetail(spaceId)}
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        공간 상세로 돌아가기
      </Link>

      <PageHeader
        eyebrow="매칭 신청"
        title={application ? '신청 현황' : '이 공간에 신청하기'}
      />

      {status === 'loading' || status === 'idle' ? (
        <div className="mt-6">
          <LoadingState label="신청 정보를 불러오는 중입니다" />
        </div>
      ) : null}

      {status === 'error' ? (
        <div className="mt-6">
          <ErrorState
            message={error ?? '신청 정보를 불러오지 못했습니다'}
            onRetry={reload}
          />
        </div>
      ) : null}

      {space ? (
        // grid 기본 stretch로 두 카드 높이를 맞춥니다 — 늘어난 높이는 각 카드가 내부에서 채웁니다.
        <div className="mt-6 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <AppliedSpaceSummary space={space} />
          {isOwnSpace ? (
            // 본인 공간에는 신청할 수 없습니다(서버도 MATCHING_SELF_APPLY로 막습니다).
            <Card padding="lg">
              <h2 className="text-xl font-black text-content">내가 등록한 공간입니다</h2>
              <p className="mt-2 text-body-sm text-content-muted">
                본인 공간에는 매칭을 신청할 수 없습니다. 받은 신청은 대시보드에서 확인하세요.
              </p>
              <Link
                className={buttonStyles({ className: 'mt-5', variant: 'outline' })}
                to={ROUTES.dashboard}
              >
                대시보드로 이동
              </Link>
            </Card>
          ) : application ? (
            <ApplicationStatusPanel
              actionError={actionError}
              actionStatus={actionStatus}
              application={application}
              onCancel={() => void cancel()}
            />
          ) : (
            <ApplicationForm
              error={actionError}
              onSubmit={(type, message) => void submit(type, message)}
              status={actionStatus}
            />
          )}
        </div>
      ) : null}
    </PageContainer>
  );
}
