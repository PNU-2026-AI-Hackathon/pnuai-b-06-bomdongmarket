import { NavLink } from 'react-router-dom';

import { PRIMARY_NAVIGATION } from '@/constants/navigation';
import { cn } from '@/utils/cn';

// 넓은 화면에서는 상단 네비게이션을 사용해 주요 데모 흐름을 빠르게 이동합니다.
export function DesktopNavigation() {
  return (
    <nav
      className="hidden items-center gap-2 lg:flex xl:gap-3"
      aria-label="주요 내비게이션"
    >
      {PRIMARY_NAVIGATION.map((item) => (
        <NavLink
          key={item.href}
          to={item.href}
          className={({ isActive }) =>
            cn(
              'inline-flex min-h-11 items-center whitespace-nowrap rounded-app px-4 text-sm font-semibold text-slate-600 transition hover:bg-leaf-50 hover:text-leaf-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-leaf-500 focus-visible:ring-offset-2 xl:px-5',
              isActive && 'bg-leaf-100 text-leaf-900',
            )
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
