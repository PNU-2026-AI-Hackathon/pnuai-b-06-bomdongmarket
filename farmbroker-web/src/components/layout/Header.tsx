import { Leaf, LogIn, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';

import { useAuth } from '@/auth/authContext';
import { buttonStyles } from '@/components/common/buttonStyles';
import { DesktopNavigation } from '@/components/layout/DesktopNavigation';
import { APP_INFO } from '@/constants/appInfo';
import { ROUTES } from '@/constants/routes';

// 브랜드, 데스크탑 네비게이션, 빠른 액션을 담당하는 상단 앱 바입니다.
export function Header() {
  const { isAuthenticated, user } = useAuth();

  return (
    <header
      className="sticky top-0 z-20 border-b border-leaf-200 bg-white/[0.97] shadow-[0_10px_30px_-24px_rgba(16,32,22,0.45)] backdrop-blur-md"
      data-build="auth-header-v2"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:gap-5">
        <Link
          className="flex items-center gap-2"
          to={ROUTES.home}
          aria-label="홈으로 이동"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-app bg-leaf-800 text-white">
            <Leaf className="h-5 w-5" aria-hidden />
          </span>
          <span>
            <span className="block text-base font-extrabold text-ink-900">
              {APP_INFO.name}
            </span>
            <span className="hidden text-xs font-semibold text-slate-500 sm:block">
              도심 스마트팜 중개
            </span>
          </span>
        </Link>
        <DesktopNavigation />
        <div className="flex shrink-0 items-center">
          {isAuthenticated ? (
            <Link
              aria-label={`${user?.nickname ?? '사용자'} 마이페이지`}
              className={buttonStyles({
                variant: 'outline',
                size: 'sm',
                className: 'max-w-36',
              })}
              to={ROUTES.myPage}
            >
              <UserRound className="h-4 w-4 shrink-0" aria-hidden />
              <span className="truncate">{user?.nickname ?? '마이페이지'}</span>
            </Link>
          ) : (
            <Link
              className={buttonStyles({ variant: 'outline', size: 'sm' })}
              to={ROUTES.login}
            >
              <LogIn className="h-4 w-4" aria-hidden />
              로그인
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
