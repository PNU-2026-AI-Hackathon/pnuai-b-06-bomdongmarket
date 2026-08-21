import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { ChatDockContext, type ChatDockValue } from '@/chat/chatDockContext';
import { ChatListPage } from '@/pages/chat/ChatListPage';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { Conversation } from '@/types/api';

// 목업 목록에는 두 종류가 한 건씩 있어 "한쪽 탭만 빈" 상태를 만들 수 없다.
// 목록은 도크에서 그대로 받아 쓰므로 컨텍스트만 흉내 내 상황을 만든다.
function dockValue(conversations: Conversation[]): ChatDockValue {
  return {
    openConversation: () => undefined,
    openContext: async () => undefined,
    conversations,
    conversationsStatus: 'success',
    lastEvent: null,
    totalUnread: 0,
    refresh: () => undefined,
  };
}

function conversation(conversationId: number): Conversation {
  return {
    conversationId,
    contextType: 'PRODUCT',
    contextId: conversationId,
    contextTitle: '버터헤드 상추',
    contextImageUrl: null,
    otherUserId: 20,
    otherUserNickname: '상추농장',
    lastMessagePreview: '내일 수확분으로 보내드릴 수 있어요.',
    lastMessageAt: '2026-08-19T09:00:00',
    unreadCount: 0,
    blocked: false,
  };
}

function page(conversations: Conversation[]) {
  return (
    <ChatDockContext.Provider value={dockValue(conversations)}>
      <ChatListPage />
    </ChatDockContext.Provider>
  );
}

describe('ChatListPage 빈 화면', () => {
  // 마켓 문의만 있는데 공간 탭을 고르면, 대화를 시작하라는 안내와 마켓 둘러보기 버튼이
  // "이 분류에는 대화가 없습니다" 와 함께 두 번 나왔다.
  it('고른 탭만 비었으면 대화를 시작하라는 안내를 띄우지 않는다', async () => {
    const user = userEvent.setup();
    renderWithProviders(page([conversation(1)]), { authenticated: true, route: '/chat' });

    await user.click(screen.getByRole('tab', { name: /공간/ }));

    expect(screen.getByText(/이 분류에는 대화가 없습니다/)).toBeInTheDocument();
    expect(screen.queryByText('아직 대화가 없습니다')).not.toBeInTheDocument();
    // 공간 탭에서 마켓으로 보내는 버튼은 갈 곳이 어긋난다.
    expect(screen.queryByRole('button', { name: '마켓 둘러보기' })).not.toBeInTheDocument();
  });

  it('대화가 아예 없으면 시작할 곳을 안내한다', () => {
    renderWithProviders(page([]), { authenticated: true, route: '/chat' });

    expect(screen.getByText('아직 대화가 없습니다')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '마켓 둘러보기' })).toBeInTheDocument();
    expect(screen.queryByText(/이 분류에는 대화가 없습니다/)).not.toBeInTheDocument();
  });

  it('대화가 있는 탭에서는 어떤 빈 안내도 띄우지 않는다', () => {
    renderWithProviders(page([conversation(1)]), { authenticated: true, route: '/chat' });

    expect(screen.queryByText('아직 대화가 없습니다')).not.toBeInTheDocument();
    expect(screen.queryByText(/이 분류에는 대화가 없습니다/)).not.toBeInTheDocument();
  });
});
