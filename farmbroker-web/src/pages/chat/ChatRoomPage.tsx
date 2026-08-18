import { ArrowLeft } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

import { useAuth } from '@/auth/authContext';
import { buttonStyles } from '@/components/common/buttonStyles';
import { Card } from '@/components/common/Card';
import { ErrorState } from '@/components/common/ErrorState';
import { PageContainer } from '@/components/layout/PageContainer';
import { ROUTES } from '@/constants/routes';
import { ChatConversationPanel } from '@/pages/chat/components/ChatConversationPanel';

// 대화 하나를 전체 화면으로 봅니다. 모바일에서 주로 쓰는 경로입니다.
// 데스크톱에서는 우측 하단 위젯으로도 같은 대화를 열 수 있습니다.
export function ChatRoomPage() {
  const { conversationId } = useParams();
  const { user } = useAuth();
  const id = Number(conversationId);

  if (!conversationId || Number.isNaN(id)) {
    return (
      <PageContainer narrow>
        <ErrorState message="잘못된 채팅방입니다" />
      </PageContainer>
    );
  }

  return (
    <PageContainer narrow>
      <Link
        className={buttonStyles({ className: 'mb-4 -ml-3', size: 'sm', variant: 'ghost' })}
        to={ROUTES.chat}
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        채팅 목록
      </Link>

      {/* 입력창이 아래에 붙어 있어야 대화처럼 읽혀서 높이를 고정합니다. */}
      <Card className="h-[70vh] overflow-hidden">
        <ChatConversationPanel conversationId={id} myUserId={user?.userId ?? null} />
      </Card>
    </PageContainer>
  );
}
