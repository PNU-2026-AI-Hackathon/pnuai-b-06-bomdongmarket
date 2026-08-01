import { ChevronRight, UserRound } from 'lucide-react';

import { useAuth } from '@/auth/authContext';
import { Badge } from '@/components/common/Badge';
import { Card } from '@/components/common/Card';
import { PageContainer } from '@/components/layout/PageContainer';
import { profileMenuItems } from '@/pages/dashboard/constants/dashboardContent';

// 모바일 와이어프레임의 마이페이지 항목을 단순하고 데모 가능한 목록으로 구성합니다.
export function MyPage() {
  const { user } = useAuth();
  const roleLabel =
    user?.role === 'FARMER'
      ? '도심 농부'
      : user?.role === 'CONSUMER'
        ? '소비자'
        : '공간 제공자';

  return (
    <PageContainer narrow>
      <Card className="p-5">
        <div className="flex items-center gap-4">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-leaf-100 text-leaf-800">
            <UserRound className="h-8 w-8" aria-hidden />
          </span>
          <div>
            <h1 className="text-2xl font-black text-ink-900">
              {user?.nickname ?? '그린스페이스랩'}
            </h1>
            <div className="mt-2">
              <Badge tone="green">{roleLabel}</Badge>
            </div>
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
            type="button"
          >
            {item}
            <ChevronRight className="h-4 w-4 text-slate-400" aria-hidden />
          </button>
        ))}
      </div>
    </PageContainer>
  );
}
