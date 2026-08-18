import { Bell, UserRound } from 'lucide-react';
import { useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '@/auth/authContext';
import { hasRole } from '@/auth/roles';
import type { BadgeTone } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingState } from '@/components/common/LoadingState';
import { buttonStyles } from '@/components/common/buttonStyles';
import { PageContainer } from '@/components/layout/PageContainer';
import { ROUTES } from '@/constants/routes';
import { useDisclosure } from '@/hooks/useDisclosure';
import { ApplicationNotificationsDialog } from '@/pages/dashboard/components/ApplicationNotificationsDialog';
import { DashboardCarousel } from '@/pages/dashboard/components/DashboardCarousel';
import { DashboardWishlistItemCard } from '@/pages/dashboard/components/DashboardWishlistItemCard';
import { DashboardSpaceCard } from '@/pages/dashboard/components/DashboardSpaceCard';
import { useDashboard } from '@/pages/dashboard/hooks/useDashboard';
import type { SpaceStatus } from '@/types/api';
import { getSpaceStatusLabel } from '@/utils/labels';

const spaceStatusTones: Record<SpaceStatus, BadgeTone> = {
  AVAILABLE: 'green',
  MATCHED: 'blue',
  CLOSED: 'slate',
};

// 로그인 이후의 공간·계약·찜 현황과 신청 알림을 한 곳에서 제공합니다.
export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const notifications = useDisclosure();
  const notificationButtonRef = useRef<HTMLButtonElement>(null);
  const {
    ownedSpaces,
    contractedSpaces,
    receivedApplications,
    sentApplications,
    wishlistItems,
    status,
    error,
    actionError,
    reload,
    dismissMatching,
  } = useDashboard();
  const isOwner = hasRole(user, 'OWNER');
  const pendingCount =
    (isOwner
      ? receivedApplications.filter((application) => application.status === 'REQUESTED')
          .length
      : 0) +
    sentApplications.filter((application) => application.status === 'REQUESTED').length;

  return (
    <PageContainer>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-semibold text-content-subtle">
            다시 만나서 반가워요
          </p>
          <h1 className="mt-1 text-page-title text-content sm:text-page-title-lg">
            대시보드
          </h1>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button
            aria-label={
              pendingCount > 0 ? '알림, 응답 대기 ' + pendingCount + '건' : '알림'
            }
            className="relative h-11 w-11 px-0"
            onClick={notifications.open}
            ref={notificationButtonRef}
            variant="outline"
          >
            <Bell className="h-5 w-5" aria-hidden />
            {pendingCount > 0 ? (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-feedback-danger px-1 text-xs font-bold text-content-inverse">
                {pendingCount > 99 ? '99+' : pendingCount}
              </span>
            ) : null}
          </Button>
          <Link
            aria-label="마이페이지"
            className={buttonStyles({
              className: 'h-11 w-11 px-0',
            })}
            to={ROUTES.myPage}
          >
            <UserRound className="h-5 w-5" aria-hidden />
          </Link>
        </div>
      </div>

      {status === 'loading' || status === 'idle' ? (
        <div className="mt-6">
          <LoadingState label="대시보드 공간과 상품을 불러오는 중입니다" />
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

      {status === 'success' ? (
        <>
          <div className="mt-8">
            <DashboardCarousel
              emptyState={
                <EmptyState
                  actionLabel="공간 등록"
                  description="새 공간을 등록하면 이곳에서 바로 관리할 수 있습니다."
                  onAction={() => navigate(ROUTES.newSpace)}
                  title="등록한 공간이 없습니다"
                />
              }
              title="내가 등록한 공간"
            >
              {ownedSpaces.map((space) => (
                <DashboardSpaceCard
                  imageUrl={space.imageUrl}
                  key={space.spaceId}
                  spaceId={space.spaceId}
                  statusLabel={getSpaceStatusLabel(space.status)}
                  statusTone={spaceStatusTones[space.status]}
                  title={space.title}
                />
              ))}
            </DashboardCarousel>
          </div>

          <div className="mt-8 scroll-mt-24" id="contracted-spaces">
            <DashboardCarousel
              emptyState={
                <EmptyState
                  actionLabel="공간 둘러보기"
                  description="양측이 계약에 동의하면 계약한 공간으로 표시됩니다."
                  onAction={() => navigate(ROUTES.spaces)}
                  title="계약한 공간이 없습니다"
                />
              }
              title="계약한 공간"
            >
              {contractedSpaces.map((space) => (
                <DashboardSpaceCard
                  imageUrl={space.imageUrl}
                  key={space.matchingId}
                  spaceId={space.spaceId}
                  statusLabel="계약 확정"
                  title={space.spaceName}
                />
              ))}
            </DashboardCarousel>
          </div>

          <div className="mt-8">
            <DashboardCarousel
              emptyState={
                <EmptyState
                  actionLabel="마켓 둘러보기"
                  description="로컬 마켓에서 마음에 드는 상품에 하트를 눌러 보세요."
                  onAction={() => navigate(ROUTES.market)}
                  title="찜한 상품이 없습니다"
                />
              }
              title="찜한 상품"
            >
              {wishlistItems.map((item) => (
                <DashboardWishlistItemCard item={item} key={item.productId} />
              ))}
            </DashboardCarousel>
          </div>

          <ApplicationNotificationsDialog
            actionError={actionError}
            isOpen={notifications.isOpen}
            isOwner={isOwner}
            onClose={notifications.close}
            onDismiss={(matchingId) => void dismissMatching(matchingId)}
            receivedApplications={receivedApplications}
            returnFocusRef={notificationButtonRef}
            sentApplications={sentApplications}
          />
        </>
      ) : null}
    </PageContainer>
  );
}
