import { ChevronRight, UserRound } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/auth/authContext';
import { ROLE_LABELS, sortRoles } from '@/auth/roles';
import { Badge } from '@/components/common/Badge';
import { Card } from '@/components/common/Card';
import { PageContainer } from '@/components/layout/PageContainer';
import { ROUTES } from '@/constants/routes';
import { profileMenuItems } from '@/pages/dashboard/constants/dashboardContent';

// 모바일 와이어프레임의 마이페이지 항목을 단순하고 데모 가능한 목록으로 구성합니다.
export function MyPage() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  // 역할은 여러 개일 수 있으므로 보유한 만큼 뱃지를 그립니다.
  const roles = sortRoles(user?.roles);

  async function handleLogout() {
    setIsLoggingOut(true);
    setLogoutError(null);
    try {
      await logout();
      navigate(ROUTES.home, { replace: true });
    } catch {
      // 서버 로그아웃 실패(네트워크·5xx) — 쿠키가 살아 있어 실제로는 로그아웃되지 않았다.
      // 로그인 상태를 유지하고 재시도를 안내한다.
      setLogoutError('로그아웃에 실패했어요. 잠시 후 다시 시도해 주세요.');
      setIsLoggingOut(false);
    }
  }

  return (
    <PageContainer narrow>
      <Card padding="lg">
        <div className="flex items-center gap-4">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-leaf-100 text-leaf-800">
            <UserRound className="h-8 w-8" aria-hidden />
          </span>
          <div>
            <h1 className="text-2xl font-black text-ink-900">
              {user?.nickname ?? '그린스페이스랩'}
            </h1>
            {roles.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {roles.map((role) => (
                  <Badge key={role} tone="green">
                    {ROLE_LABELS[role]}
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-2">
          {[
            ['공간', '4'],
            ['구매', '8'],
            ['정산', '120만원'],
          ].map(([label, value]) => (
            <div key={label} className="rounded-app bg-leaf-50 p-3 text-center">
              <p className="text-lg font-black text-ink-900">{value}</p>
              <p className="text-xs font-semibold text-slate-500">{label}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="mt-5 grid gap-2">
        {profileMenuItems.map((item) => (
          <button
            key={item}
            className="flex min-h-12 items-center justify-between rounded-app border border-leaf-100 bg-white px-4 text-left text-sm font-bold text-ink-900 shadow-card"
            disabled={item === '로그아웃' && isLoggingOut}
            onClick={item === '로그아웃' ? () => void handleLogout() : undefined}
            type="button"
          >
            {item === '로그아웃' && isLoggingOut ? '로그아웃 중...' : item}
            <ChevronRight className="h-4 w-4 text-slate-400" aria-hidden />
          </button>
        ))}
      </div>

      {logoutError ? (
        <p className="mt-3 text-sm font-semibold text-red-600" role="alert">
          {logoutError}
        </p>
      ) : null}
    </PageContainer>
  );
}
