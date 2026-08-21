import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

import { ChatDockContext, type ChatDockValue } from '@/chat/chatDockContext';
import { ChatConversationPanel } from '@/pages/chat/components/ChatConversationPanel';
import { getConversations } from '@/services/chatService';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { ChatMessage } from '@/types/api';

// 소켓은 도크에 하나만 열려 있고 대화 화면은 컨텍스트로 이벤트를 받는다.
// 여기서는 그 컨텍스트만 흉내 내 실제 연결 없이 수신 동작을 검증한다.
function dockValue(lastEvent: ChatDockValue['lastEvent']): ChatDockValue {
  return {
    openConversation: () => undefined,
    openContext: async () => undefined,
    conversations: [],
    conversationsStatus: 'success',
    lastEvent,
    totalUnread: 0,
    refresh: () => undefined,
  };
}

function incoming(messageId: number, text: string, senderId: number): ChatMessage {
  return {
    messageId,
    conversationId: 1,
    senderId,
    type: 'TEXT',
    text,
    imagePath: null,
    imageContentType: null,
    createdAt: '2026-08-17T10:00:00',
  };
}

// 목업 1번 방에는 내(1번) 메시지와 상대(20번) 메시지가 한 건씩 들어 있다.
describe('ChatConversationPanel', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it('주고받은 메시지를 보여준다', async () => {
    renderWithProviders(<ChatConversationPanel conversationId={1} myUserId={1} />);

    expect(await screen.findByText('상추 아직 남아 있나요?')).toBeInTheDocument();
    expect(screen.getByText('내일 수확분으로 보내드릴 수 있어요.')).toBeInTheDocument();
  });

  it('메시지를 보내면 목록 끝에 붙는다', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ChatConversationPanel conversationId={1} myUserId={1} />);

    await screen.findByText('상추 아직 남아 있나요?');
    await user.type(screen.getByLabelText('메시지 입력'), '금요일에 받을 수 있을까요?');
    await user.click(screen.getByRole('button', { name: '보내기' }));

    expect(await screen.findByText('금요일에 받을 수 있을까요?')).toBeInTheDocument();
  });

  it('빈 메시지는 보낼 수 없다', async () => {
    renderWithProviders(<ChatConversationPanel conversationId={1} myUserId={1} />);

    await screen.findByText('상추 아직 남아 있나요?');
    expect(screen.getByRole('button', { name: '보내기' })).toBeDisabled();
  });

  // 방을 열면 읽음 처리가 함께 나가 목록의 안읽음 배지가 정리돼야 한다.
  it('방을 열면 안 읽은 수가 0이 된다', async () => {
    renderWithProviders(<ChatConversationPanel conversationId={1} myUserId={1} />);

    await screen.findByText('상추 아직 남아 있나요?');

    await waitFor(async () => {
      const list = await getConversations();
      const room = list.conversations.find((item) => item.conversationId === 1);
      expect(room?.unreadCount).toBe(0);
    });
  });

  it('사진을 고르면 파일 이름을 보여주고 뺄 수 있다', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ChatConversationPanel conversationId={1} myUserId={1} />);

    await screen.findByText('상추 아직 남아 있나요?');
    await user.upload(
      screen.getByLabelText('사진 선택'),
      new File(['x'], 'lettuce.jpg', { type: 'image/jpeg' }),
    );

    expect(await screen.findByText('lettuce.jpg')).toBeInTheDocument();
    // 사진만 있어도 보낼 수 있어야 한다
    expect(screen.getByRole('button', { name: '보내기' })).toBeEnabled();

    await user.click(screen.getByRole('button', { name: '사진 빼기' }));
    expect(screen.queryByText('lettuce.jpg')).not.toBeInTheDocument();
  });

  // 서버(ChatImageStorage)는 gif 를 받지 않는다. 고르는 창이 gif 를 제시하면
  // 골라 놓고 보내는 순간에야 FILE_TYPE_NOT_SUPPORTED 로 막힌다.
  it('사진 고르는 창은 서버가 받는 형식만 제시한다', async () => {
    renderWithProviders(<ChatConversationPanel conversationId={1} myUserId={1} />);

    await screen.findByText('상추 아직 남아 있나요?');
    expect(screen.getByLabelText('사진 선택')).toHaveAttribute('accept', '.jpg,.jpeg,.png,.webp');
  });

  // 목업 대화에는 메시지가 2건뿐이라 더 불러올 것이 없다.
  it('더 불러올 이전 메시지가 없으면 버튼을 두지 않는다', async () => {
    renderWithProviders(<ChatConversationPanel conversationId={1} myUserId={1} />);

    await screen.findByText('상추 아직 남아 있나요?');
    expect(screen.queryByRole('button', { name: /이전 메시지 더 보기/ })).not.toBeInTheDocument();
  });

  it('차단하면 입력창이 잠긴다', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ChatConversationPanel conversationId={1} myUserId={1} />);

    await screen.findByText('상추 아직 남아 있나요?');
    await user.click(screen.getByRole('button', { name: '차단하기' }));

    expect(await screen.findByText(/차단된 상대와는 대화할 수 없습니다/)).toBeInTheDocument();
    expect(screen.queryByLabelText('메시지 입력')).not.toBeInTheDocument();
  });

  // 방을 켜 놓고 있는데 상대 메시지가 토스트로만 뜨고 대화에는 안 나타나면,
  // 나갔다 다시 들어와야 보인다.
  it('보고 있는 방에 온 실시간 메시지가 대화에 붙는다', async () => {
    function panel(lastEvent: ChatDockValue['lastEvent']) {
      return (
        <ChatDockContext.Provider value={dockValue(lastEvent)}>
          <ChatConversationPanel conversationId={1} myUserId={1} />
        </ChatDockContext.Provider>
      );
    }

    const { rerender } = renderWithProviders(panel(null));
    await screen.findByText('상추 아직 남아 있나요?');

    rerender(
      panel({
        type: 'MESSAGE',
        conversationId: 1,
        message: incoming(9001, '지금 막 수확했어요.', 20),
        unreadCount: 1,
      }),
    );

    expect(await screen.findByText('지금 막 수확했어요.')).toBeInTheDocument();
  });

  // 서버는 보낸 사람에게도 MESSAGE_CREATED 를 준다. 소켓 이벤트가 전송 API 응답보다
  // 먼저 도착하면 같은 메시지가 두 번 붙어 내 말풍선만 두 개로 보인다.
  it('소켓 이벤트가 전송 응답보다 먼저 와도 한 번만 붙는다', async () => {
    const user = userEvent.setup();
    const text = '금요일에 받을 수 있을까요?';

    function panel(lastEvent: ChatDockValue['lastEvent']) {
      return (
        <ChatDockContext.Provider value={dockValue(lastEvent)}>
          <ChatConversationPanel conversationId={1} myUserId={1} />
        </ChatDockContext.Provider>
      );
    }

    const { rerender } = renderWithProviders(panel(null));
    await screen.findByText('상추 아직 남아 있나요?');

    // 목업 전송이 돌려줄 messageId(100)로 이벤트가 먼저 도착한 상황을 만든다.
    rerender(
      panel({
        type: 'MESSAGE_CREATED',
        conversationId: 1,
        message: incoming(100, text, 1),
        unreadCount: 0,
      }),
    );
    expect(await screen.findByText(text)).toBeInTheDocument();

    // 그 뒤 전송 응답이 같은 메시지를 들고 도착한다.
    await user.type(screen.getByLabelText('메시지 입력'), text);
    await user.click(screen.getByRole('button', { name: '보내기' }));

    await waitFor(() => expect(screen.getByLabelText('메시지 입력')).toHaveValue(''));
    expect(screen.getAllByText(text)).toHaveLength(1);
  });

  it('다른 방 이벤트는 무시한다', async () => {
    function panel(lastEvent: ChatDockValue['lastEvent']) {
      return (
        <ChatDockContext.Provider value={dockValue(lastEvent)}>
          <ChatConversationPanel conversationId={1} myUserId={1} />
        </ChatDockContext.Provider>
      );
    }

    const { rerender } = renderWithProviders(panel(null));
    await screen.findByText('상추 아직 남아 있나요?');

    rerender(
      panel({
        type: 'MESSAGE',
        conversationId: 2,
        message: { ...incoming(9002, '다른 방 메시지', 30), conversationId: 2 },
        unreadCount: 1,
      }),
    );

    expect(screen.queryByText('다른 방 메시지')).not.toBeInTheDocument();
  });
});
