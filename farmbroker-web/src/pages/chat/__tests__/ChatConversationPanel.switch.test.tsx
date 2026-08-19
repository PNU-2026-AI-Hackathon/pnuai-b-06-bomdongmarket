import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ChatConversationPanel } from '@/pages/chat/components/ChatConversationPanel';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { ChatMessage, ChatMessageList, Conversation } from '@/types/api';

// 도크에서 방을 갈아타면 컴포넌트는 그대로 남고 conversationId 만 바뀐다.
// 목업은 응답 순서를 정해 줄 수 없어 여기서는 서비스 계층을 직접 붙잡고
// "앞 방 응답이 뒤늦게 도착하는" 순서를 만든다.
const mocks = vi.hoisted(() => ({
  getConversation: vi.fn(),
  getMessages: vi.fn(),
  markRead: vi.fn(),
  sendMessage: vi.fn(),
  blockUser: vi.fn(),
  unblockUser: vi.fn(),
}));

vi.mock('@/services/chatService', () => mocks);

function room(conversationId: number, nickname: string): Conversation {
  return {
    conversationId,
    contextType: 'PRODUCT',
    contextId: conversationId,
    contextTitle: `상품 ${conversationId}`,
    contextImageUrl: null,
    otherUserId: 100 + conversationId,
    otherUserNickname: nickname,
    lastMessagePreview: null,
    lastMessageAt: null,
    unreadCount: 0,
    blocked: false,
  };
}

function message(messageId: number, conversationId: number, text: string): ChatMessage {
  return {
    messageId,
    conversationId,
    senderId: 100 + conversationId,
    type: 'TEXT',
    text,
    imagePath: null,
    imageContentType: null,
    createdAt: '2026-08-19T10:00:00',
  };
}

function page(messages: ChatMessage[]): ChatMessageList {
  return { messages, nextBeforeId: null, hasNext: false };
}

// 지연된 응답을 원하는 순서로 풀어 주기 위한 손잡이.
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((settle) => {
    resolve = settle;
  });
  return { promise, resolve };
}

describe('ChatConversationPanel 방 전환', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.markRead.mockResolvedValue(undefined);
  });

  // 1번 방을 열자마자 2번 방으로 옮겼는데 1번 응답이 나중에 도착하면,
  // 2번 방 화면에 1번 방의 상대 이름과 메시지가 앉는다.
  it('먼저 연 방의 늦은 응답이 지금 보는 방을 덮지 않는다', async () => {
    const slowRoom = deferred<Conversation>();
    const slowMessages = deferred<ChatMessageList>();

    mocks.getConversation.mockImplementation((id: number) =>
      id === 1 ? slowRoom.promise : Promise.resolve(room(2, '두 번째 상대')),
    );
    mocks.getMessages.mockImplementation((id: number) =>
      id === 1 ? slowMessages.promise : Promise.resolve(page([message(20, 2, '두 번째 방 메시지')])),
    );

    const { rerender } = renderWithProviders(
      <ChatConversationPanel conversationId={1} myUserId={1} />,
    );

    // 1번 응답이 오기 전에 2번 방으로 갈아탄다.
    rerender(<ChatConversationPanel conversationId={2} myUserId={1} />);
    expect(await screen.findByText('두 번째 상대')).toBeInTheDocument();

    // 이제서야 1번 방 응답이 도착한다.
    slowRoom.resolve(room(1, '첫 번째 상대'));
    slowMessages.resolve(page([message(10, 1, '첫 번째 방 메시지')]));

    await waitFor(() => expect(screen.getByText('두 번째 방 메시지')).toBeInTheDocument());
    expect(screen.queryByText('첫 번째 상대')).not.toBeInTheDocument();
    expect(screen.queryByText('첫 번째 방 메시지')).not.toBeInTheDocument();
  });

  // 보내는 사이 방을 옮기면 응답이 지금 보고 있는 방에 붙어,
  // 상대에게는 가지도 않은 말이 이 방 대화에 남는다.
  it('보내는 사이 방을 옮기면 그 응답을 새 방에 붙이지 않는다', async () => {
    const slowSend = deferred<ChatMessage>();
    mocks.getConversation.mockImplementation((id: number) => Promise.resolve(room(id, `상대 ${id}`)));
    mocks.getMessages.mockImplementation((id: number) =>
      Promise.resolve(page([message(id * 10, id, `${id}번 방 메시지`)])),
    );
    mocks.sendMessage.mockReturnValue(slowSend.promise);

    const user = userEvent.setup();
    const { rerender } = renderWithProviders(
      <ChatConversationPanel conversationId={1} myUserId={1} />,
    );

    await screen.findByText('1번 방 메시지');
    await user.type(screen.getByLabelText('메시지 입력'), '1번 방에 보내는 말');
    await user.click(screen.getByRole('button', { name: '보내기' }));

    rerender(<ChatConversationPanel conversationId={2} myUserId={1} />);
    await screen.findByText('2번 방 메시지');

    slowSend.resolve({ ...message(999, 1, '1번 방에 보내는 말'), senderId: 1 });

    await waitFor(() => expect(screen.getByText('2번 방 메시지')).toBeInTheDocument());
    expect(screen.queryByText('1번 방에 보내는 말')).not.toBeInTheDocument();
  });

  // 방을 옮겼는데 앞 방에 쓰던 말이 입력창에 남아 있으면 그대로 다른 사람에게 보내진다.
  it('방을 옮기면 쓰던 입력을 비운다', async () => {
    mocks.getConversation.mockImplementation((id: number) => Promise.resolve(room(id, `상대 ${id}`)));
    mocks.getMessages.mockImplementation((id: number) =>
      Promise.resolve(page([message(id * 10, id, `${id}번 방 메시지`)])),
    );

    const user = userEvent.setup();
    const { rerender } = renderWithProviders(
      <ChatConversationPanel conversationId={1} myUserId={1} />,
    );

    await screen.findByText('1번 방 메시지');
    await user.type(screen.getByLabelText('메시지 입력'), '1번 방에만 할 말');

    rerender(<ChatConversationPanel conversationId={2} myUserId={1} />);
    await screen.findByText('2번 방 메시지');

    expect(screen.getByLabelText('메시지 입력')).toHaveValue('');
  });
});
