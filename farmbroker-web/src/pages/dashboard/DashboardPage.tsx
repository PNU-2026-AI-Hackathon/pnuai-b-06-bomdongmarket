import { Bell, Plus, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';

import { buttonStyles } from '@/components/common/buttonStyles';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingState } from '@/components/common/LoadingState';
import { PageContainer } from '@/components/layout/PageContainer';
import { ROUTES } from '@/constants/routes';
import { ContractCard } from '@/pages/dashboard/components/ContractCard';
import { MatchingRequestCard } from '@/pages/dashboard/components/MatchingRequestCard';
import { MetricCard } from '@/pages/dashboard/components/MetricCard';
import { useDashboard } from '@/pages/dashboard/hooks/useDashboard';

// 로그인 이후의 홈 대시보드로, 소유자 관점의 요약과 신청 검토 흐름을 제공합니다.
export function DashboardPage() {
  const {
    metrics,
    matchings,
    contracts,
    status,
    error,
    actionError,
    updatingMatchingId,
    reload,
    respondToMatching,
  } = useDashboard();

  return (
    <PageContainer>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-semibold text-slate-500">다시 만나서 반가워요</p>
          <h1 className="mt-1 text-3xl font-black text-ink-900">그린스페이스랩</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            aria-label="알림"
            className="flex h-11 w-11 items-center justify-center rounded-app border border-leaf-100 bg-white text-leaf-700"
            type="button"
          >
            <Bell className="h-5 w-5" aria-hidden />
          </button>
          <Link
            aria-label="마이페이지"
            className="flex h-11 w-11 items-center justify-center rounded-app bg-leaf-700 text-white"
            to={ROUTES.myPage}
          >
            <UserRound className="h-5 w-5" aria-hidden />
          </Link>
        </div>
      </div>

      {status === 'loading' || status === 'idle' ? (
        <div className="mt-6">
          <LoadingState label="대시보드를 불러오는 중입니다" />
        </div>
      ) : null}
      {status === 'error' ? (
        <div className="mt-6">
          <ErrorState
            message={error ?? '대시보드를 불러오지 못했습니다'}
            onRetry={reload}
          />
        </div>
      ) : null}
      {actionError ? (
        <div
          className="mt-6 rounded-app border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700"
          role="alert"
        >
          {actionError}
        </div>
      ) : null}

      {status === 'success' ? (
        <>
          <section className="mt-6 grid gap-4 md:grid-cols-3" aria-label="요약 카드">
            {metrics.map((metric) => (
              <MetricCard key={metric.label} metric={metric} />
            ))}
          </section>

          <section className="mt-8" aria-labelledby="dashboard-actions">
            <div className="flex items-center justify-between gap-4">
              <h2 id="dashboard-actions" className="text-2xl font-black text-ink-900">
                빠른 실행
              </h2>
              <Link
                className={buttonStyles({ variant: 'outline', size: 'sm' })}
                to={ROUTES.newSpace}
              >
                <Plus className="h-4 w-4" aria-hidden />
                공간 등록
              </Link>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ['공간 등록', ROUTES.newSpace],
                ['수익 시뮬레이션', ROUTES.prediction],
                ['매칭 찾기', ROUTES.farmer],
                ['마켓 열기', ROUTES.market],
              ].map(([label, href]) => (
                <Link
                  key={label}
                  className="rounded-app border border-leaf-100 bg-white p-4 text-sm font-bold text-ink-900 shadow-card transition hover:border-leaf-300"
                  to={href}
                >
                  {label}
                </Link>
              ))}
            </div>
          </section>

          <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_0.9fr]">
            <section aria-labelledby="received-matchings-title">
              <h2
                id="received-matchings-title"
                className="text-2xl font-black text-ink-900"
              >
                받은 매칭 신청
              </h2>
              <div className="mt-4 grid gap-4">
                {matchings.map((request) => (
                  <MatchingRequestCard
                    isUpdating={updatingMatchingId === request.matchingId}
                    key={request.matchingId}
                    onAccept={() => void respondToMatching(request.matchingId, 'accept')}
                    onReject={() => void respondToMatching(request.matchingId, 'reject')}
                    request={request}
                  />
                ))}
              </div>
            </section>
            <section aria-labelledby="contract-preview-title">
              <div className="flex items-center justify-between gap-3">
                <h2
                  id="contract-preview-title"
                  className="text-2xl font-black text-ink-900"
                >
                  계약
                </h2>
                <Link className="text-sm font-bold text-leaf-700" to={ROUTES.contracts}>
                  전체 보기
                </Link>
              </div>
              <div className="mt-4 grid gap-4">
                {contracts.slice(0, 2).map((contract) => (
                  <ContractCard contract={contract} key={contract.contractId} />
                ))}
              </div>
            </section>
          </div>
        </>
      ) : null}
    </PageContainer>
  );
}
