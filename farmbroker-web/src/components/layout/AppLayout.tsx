import { Outlet } from 'react-router-dom';

import { BottomNavigation } from '@/components/layout/BottomNavigation';
import { Header } from '@/components/layout/Header';

// 모든 주요 페이지가 공유하는 반응형 앱 레이아웃입니다.
export function AppLayout() {
  return (
    <div className="min-h-screen bg-[#f6f8f3]">
      <Header />
      <Outlet />
      <BottomNavigation />
    </div>
  );
}
