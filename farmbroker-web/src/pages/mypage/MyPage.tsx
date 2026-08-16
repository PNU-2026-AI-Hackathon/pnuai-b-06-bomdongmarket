import { ChevronRight, LogOut, UserRound } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { ApiError } from '@/api/client';
import { useAuth } from '@/auth/authContext';
import { ROLE_LABELS, sortRoles } from '@/auth/roles';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { PageHeader } from '@/components/common/PageHeader';
import { PageContainer } from '@/components/layout/PageContainer';
import { ROUTES } from '@/constants/routes';
import { cn } from '@/utils/cn';

const accountMenuItems = [
  {
    label: '계정 정보 수정',
    description: '닉네임과 비밀번호를 변경합니다.',
    to: ROUTES.myPageProfile,
    tone: 'default',
  },
  {
    label: '회원 탈퇴',
    description: '계정과 개인화 데이터를 안전하게 정리합니다.',
    to: ROUTES.myPageWithdraw,
    tone: 'danger',
  },
] as const;

const serviceMenuItems = [
  {
    label: '찜',
    description: '담아 둔 상품을 확인하고 결제를 진행합니다.',
    to: ROUTES.wishlist,
  },
  {
    label: '판매 상품 관리',
    description: '등록한 상품과 판매 상태를 관리합니다.',
    to: ROUTES.myProducts,
    farmerOnly: true,
  },
] as const;

export function MyPage() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const roles = sortRoles(user?.roles);
  const visibleServiceMenuItems = serviceMenuItems.filter(
    (item) => !('farmerOnly' in item) || roles.includes('FARMER'),
  );

  async function handleLogout() {
    setIsLoggingOut(true);
    setLogoutError(null);
    try {
      await logout();
      navigate(ROUTES.home, { replace: true });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        navigate(ROUTES.home, { replace: true });
        return;
      }
      setLogoutError('로그아웃하지 못했습니다. 잠시 후 다시 시도해 주세요.');
      setIsLoggingOut(false);
    }
  }

  return (
    <PageContainer narrow>
      <PageHeader
        description="계정 정보와 보유 역할, 찜과 판매 활동을 한곳에서 확인하세요."
        eyebrow="Account"
        title="마이페이지"
      />

      <Card className="mt-6" padding="lg">
        <section aria-labelledby="account-summary-title" className="flex items-start gap-4">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-action-soft text-action">
            <UserRound className="h-8 w-8" aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 className="break-words text-xl font-black text-content" id="account-summary-title">
              {user?.nickname ?? '사용자'}
            </h2>
            <p className="mt-1 break-all text-sm text-content-muted">
              {user?.email ?? '이메일 정보를 불러오지 못했습니다.'}
            </p>
            {roles.length > 0 ? (
              <div aria-label="보유 역할" className="mt-3 flex flex-wrap gap-1.5">
                {roles.map((role) => (
                  <Badge key={role} tone="green">
                    {ROLE_LABELS[role]}
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>
        </section>
      </Card>

      <section aria-labelledby="service-activity-title" className="mt-6">
        <h2 className="text-lg font-bold text-content" id="service-activity-title">
          서비스 이용
        </h2>
        <div className="mt-3 grid gap-2">
          {visibleServiceMenuItems.map((item) => (
            <Link
              className="flex min-h-14 items-center justify-between gap-3 rounded-app border border-line bg-surface px-4 py-3 shadow-card transition-colors duration-ui hover:border-line-strong focus-visible:ring-2 focus-visible:ring-action"
              key={item.to}
              to={item.to}
            >
              <span>
                <span className="block text-sm font-bold text-content">{item.label}</span>
                <span className="mt-1 block text-xs font-normal text-content-subtle">
                  {item.description}
                </span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="account-settings-title" className="mt-6">
        <h2 className="text-lg font-bold text-content" id="account-settings-title">
          계정 설정
        </h2>
        <div className="mt-3 grid gap-2">
          {accountMenuItems.map((item) => (
            <Link
              className={cn(
                'flex min-h-14 items-center justify-between gap-3 rounded-app border border-line bg-surface px-4 py-3 shadow-card transition-colors duration-ui hover:border-line-strong focus-visible:ring-2 focus-visible:ring-action',
                item.tone === 'danger' &&
                  'text-feedback-danger hover:border-feedback-danger hover:bg-feedback-danger-soft',
              )}
              key={item.to}
              to={item.to}
            >
              <span>
                <span className="block text-sm font-bold">{item.label}</span>
                <span
                  className={cn(
                    'mt-1 block text-xs font-normal text-content-subtle',
                    item.tone === 'danger' && 'text-feedback-danger',
                  )}
                >
                  {item.description}
                </span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
            </Link>
          ))}
          <Button
            className="w-full justify-between"
            disabled={isLoggingOut}
            onClick={() => void handleLogout()}
            variant="outline"
          >
            <span>{isLoggingOut ? '로그아웃 중...' : '로그아웃'}</span>
            <LogOut className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      </section>

      {logoutError ? (
        <p className="mt-3 text-sm font-semibold text-feedback-danger" role="alert">
          {logoutError}
        </p>
      ) : null}
    </PageContainer>
  );
}
