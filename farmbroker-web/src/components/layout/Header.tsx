import { Leaf, LogIn, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

import { APP_INFO } from '../../constants/appInfo';
import { ROUTES } from '../../constants/routes';
import { buttonStyles } from '../common/buttonStyles';
import { DesktopNavigation } from './DesktopNavigation';

// 브랜드, 데스크탑 네비게이션, 빠른 액션을 담당하는 상단 앱 바입니다.
export function Header() {
  return (
    <header className="bg-white/92 sticky top-0 z-20 border-b border-leaf-100 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link className="flex items-center gap-2" to={ROUTES.home} aria-label="Go home">
          <span className="flex h-10 w-10 items-center justify-center rounded-app bg-leaf-800 text-white">
            <Leaf className="h-5 w-5" aria-hidden />
          </span>
          <span>
            <span className="block text-base font-extrabold text-ink-900">
              {APP_INFO.name}
            </span>
            <span className="hidden text-xs font-semibold text-slate-500 sm:block">
              Urban farm brokerage
            </span>
          </span>
        </Link>
        <DesktopNavigation />
        <div className="flex items-center gap-2">
          <Link
            className={buttonStyles({
              variant: 'outline',
              size: 'sm',
              className: 'hidden sm:inline-flex',
            })}
            to={ROUTES.login}
          >
            <LogIn className="h-4 w-4" aria-hidden />
            Login
          </Link>
          <Link
            className={buttonStyles({ variant: 'primary', size: 'sm' })}
            to={ROUTES.newSpace}
          >
            <Plus className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">Register Space</span>
            <span className="sm:hidden">Add</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
