import { NavLink } from 'react-router-dom';

import { MOBILE_NAVIGATION } from '@/constants/navigation';
import { cn } from '@/utils/cn';

// 모바일 화면의 주 이동 수단입니다. 와이어프레임의 앱형 하단 탭을 웹에 맞춰 옮겼습니다.
export function BottomNavigation() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-leaf-100 bg-white/95 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 shadow-[0_-16px_40px_-28px_rgba(16,32,22,0.6)] backdrop-blur lg:hidden"
      aria-label="모바일 내비게이션"
    >
      <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
        {MOBILE_NAVIGATION.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) =>
              cn(
                'flex min-h-14 flex-col items-center justify-center rounded-app text-xs font-semibold text-slate-500 transition hover:bg-leaf-50',
                isActive && 'bg-leaf-100 text-leaf-800',
              )
            }
          >
            <item.icon className="mb-1 h-5 w-5" aria-hidden />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
