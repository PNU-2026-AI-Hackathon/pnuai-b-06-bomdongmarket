import { Outlet } from 'react-router-dom';

import { ChatDockProvider } from '@/chat/ChatDockProvider';
import { BottomNavigation } from '@/components/layout/BottomNavigation';
import { Header } from '@/components/layout/Header';

// 모든 주요 페이지가 공유하는 반응형 앱 레이아웃입니다.
// 채팅 도크는 라우트 밖에 둡니다 — 페이지를 옮겨도 대화가 끊기지 않아야 합니다.
export function AppLayout() {
  return (
    <ChatDockProvider>
      <div className="min-h-screen bg-canvas">
        <Header />
        <Outlet />
        <BottomNavigation />
      </div>
    </ChatDockProvider>
  );
}
