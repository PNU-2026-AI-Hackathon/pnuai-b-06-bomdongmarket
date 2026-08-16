import { apiRequest, USE_MOCKS } from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
import { mockDelay } from '@/mocks/handlers';
import type {
  ChatContextType,
  ChatMessage,
  ChatMessageList,
  ChatReadResult,
  Conversation,
  ConversationList,
} from '@/types/api';

// 채팅 API.
// 방은 (맥락, 두 참여자)로 유일해서, 같은 상품·공간에 다시 말을 걸어도 기존 방이 열립니다.
// 공간 문의와 마켓 문의가 같은 API를 쓰고 contextType 으로만 갈립니다.

export async function createOrGetConversation(
  contextType: ChatContextType,
  contextId: number,
): Promise<Conversation> {
  if (USE_MOCKS) {
    await mockDelay();
    return mockCreateOrGet(contextType, contextId);
  }

  const response = await apiRequest<Conversation>(ENDPOINTS.chat.conversations, {
    method: 'POST',
    body: { contextType, contextId },
  });
  return response.data;
}

export async function getConversations(page = 0, size = 20): Promise<ConversationList> {
  if (USE_MOCKS) {
    await mockDelay();
    return { conversations: readMockConversations(), page, size, hasNext: false };
  }

  const response = await apiRequest<ConversationList>(
    `${ENDPOINTS.chat.conversations}?page=${page}&size=${size}`,
  );
  return response.data;
}

export async function getConversation(conversationId: number): Promise<Conversation> {
  if (USE_MOCKS) {
    await mockDelay();
    const found = readMockConversations().find(
      (item) => item.conversationId === conversationId,
    );
    if (!found) throw new Error('채팅방을 찾을 수 없습니다.');
    return found;
  }

  const response = await apiRequest<Conversation>(ENDPOINTS.chat.conversation(conversationId));
  return response.data;
}

export async function getMessages(
  conversationId: number,
  beforeId?: number | null,
  size = 30,
): Promise<ChatMessageList> {
  if (USE_MOCKS) {
    await mockDelay();
    return { messages: readMockMessages(conversationId), nextBeforeId: null, hasNext: false };
  }

  const query = new URLSearchParams({ size: String(size) });
  if (beforeId != null) query.set('beforeId', String(beforeId));
  const response = await apiRequest<ChatMessageList>(
    `${ENDPOINTS.chat.messages(conversationId)}?${query.toString()}`,
  );
  return response.data;
}

// 텍스트와 이미지를 함께 보낼 수 있어 multipart로 보냅니다(서버 계약).
export async function sendMessage(
  conversationId: number,
  text: string,
  image?: File | null,
): Promise<ChatMessage> {
  if (USE_MOCKS) {
    await mockDelay();
    return mockSend(conversationId, text);
  }

  const form = new FormData();
  if (text) form.append('text', text);
  if (image) form.append('image', image);
  const response = await apiRequest<ChatMessage>(ENDPOINTS.chat.messages(conversationId), {
    method: 'POST',
    body: form,
  });
  return response.data;
}

export async function markRead(conversationId: number): Promise<ChatReadResult> {
  if (USE_MOCKS) {
    await mockDelay();
    return mockMarkRead(conversationId);
  }

  const response = await apiRequest<ChatReadResult>(ENDPOINTS.chat.read(conversationId), {
    method: 'POST',
  });
  return response.data;
}

// 차단은 채팅 상대에게만 걸므로 채팅 서비스에 함께 둡니다.
// 서버가 양방향 차단을 모두 막으므로, 내가 걸었든 상대가 걸었든 대화가 잠깁니다.
export async function blockUser(userId: number): Promise<void> {
  if (USE_MOCKS) {
    await mockDelay();
    setMockBlocked(userId, true);
    return;
  }
  await apiRequest<unknown>(ENDPOINTS.blocks.user(userId), { method: 'POST' });
}

export async function unblockUser(userId: number): Promise<void> {
  if (USE_MOCKS) {
    await mockDelay();
    setMockBlocked(userId, false);
    return;
  }
  await apiRequest<unknown>(ENDPOINTS.blocks.user(userId), { method: 'DELETE' });
}

// ── 목업 ──
// 백엔드 없이도 목록→방→전송→안읽음 정리 흐름이 그대로 보이도록 sessionStorage에 담아 둡니다.

const MOCK_KEY = 'farmbroker.mock.chat';

interface MockState {
  conversations: Conversation[];
  messages: Record<number, ChatMessage[]>;
  nextConversationId: number;
  nextMessageId: number;
}

const MOCK_ME = 1;

function seed(): MockState {
  return {
    conversations: [
      {
        conversationId: 1,
        contextType: 'PRODUCT',
        contextId: 1,
        contextTitle: '버터헤드 상추',
        contextImageUrl: null,
        otherUserId: 20,
        otherUserNickname: '어반리프',
        lastMessagePreview: '내일 수확분으로 보내드릴 수 있어요.',
        lastMessageAt: '2026-08-16T09:20:00',
        unreadCount: 1,
        blocked: false,
      },
      {
        conversationId: 2,
        contextType: 'SPACE',
        contextId: 1,
        contextTitle: '부산대 앞 20평 상가 공실',
        contextImageUrl: null,
        otherUserId: 30,
        otherUserNickname: '그린스페이스랩',
        lastMessagePreview: '수요일 오후에 보러 가도 될까요?',
        lastMessageAt: '2026-08-15T18:02:00',
        unreadCount: 0,
        blocked: false,
      },
    ],
    messages: {
      1: [
        {
          messageId: 11,
          conversationId: 1,
          senderId: MOCK_ME,
          type: 'TEXT',
          text: '상추 아직 남아 있나요?',
          imagePath: null,
          imageContentType: null,
          createdAt: '2026-08-16T09:18:00',
        },
        {
          messageId: 12,
          conversationId: 1,
          senderId: 20,
          type: 'TEXT',
          text: '내일 수확분으로 보내드릴 수 있어요.',
          imagePath: null,
          imageContentType: null,
          createdAt: '2026-08-16T09:20:00',
        },
      ],
      2: [
        {
          messageId: 21,
          conversationId: 2,
          senderId: MOCK_ME,
          type: 'TEXT',
          text: '수요일 오후에 보러 가도 될까요?',
          imagePath: null,
          imageContentType: null,
          createdAt: '2026-08-15T18:02:00',
        },
      ],
    },
    nextConversationId: 3,
    nextMessageId: 100,
  };
}

function readState(): MockState {
  if (typeof window === 'undefined') return seed();
  try {
    const saved = window.sessionStorage.getItem(MOCK_KEY);
    return saved ? (JSON.parse(saved) as MockState) : seed();
  } catch {
    return seed();
  }
}

function writeState(state: MockState) {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(MOCK_KEY, JSON.stringify(state));
  } catch {
    // 저장에 실패해도 이번 화면 동작은 이어집니다.
  }
}

function readMockConversations(): Conversation[] {
  return [...readState().conversations].sort((a, b) =>
    (b.lastMessageAt ?? '').localeCompare(a.lastMessageAt ?? ''),
  );
}

function readMockMessages(conversationId: number): ChatMessage[] {
  return readState().messages[conversationId] ?? [];
}

function mockCreateOrGet(contextType: ChatContextType, contextId: number): Conversation {
  const state = readState();
  const existing = state.conversations.find(
    (item) => item.contextType === contextType && item.contextId === contextId,
  );
  if (existing) return existing;

  const created: Conversation = {
    conversationId: state.nextConversationId,
    contextType,
    contextId,
    contextTitle: contextType === 'PRODUCT' ? '상품 문의' : '공간 문의',
    contextImageUrl: null,
    otherUserId: 99,
    otherUserNickname: '판매자',
    lastMessagePreview: null,
    lastMessageAt: null,
    unreadCount: 0,
    blocked: false,
  };
  state.conversations.push(created);
  state.messages[created.conversationId] = [];
  state.nextConversationId += 1;
  writeState(state);
  return created;
}

function mockSend(conversationId: number, text: string): ChatMessage {
  const state = readState();
  const message: ChatMessage = {
    messageId: state.nextMessageId,
    conversationId,
    senderId: MOCK_ME,
    type: 'TEXT',
    text,
    imagePath: null,
    imageContentType: null,
    createdAt: new Date().toISOString().slice(0, 19),
  };
  state.messages[conversationId] = [...(state.messages[conversationId] ?? []), message];
  state.nextMessageId += 1;
  state.conversations = state.conversations.map((item) =>
    item.conversationId === conversationId
      ? { ...item, lastMessagePreview: text, lastMessageAt: message.createdAt }
      : item,
  );
  writeState(state);
  return message;
}

function setMockBlocked(otherUserId: number, blocked: boolean) {
  const state = readState();
  state.conversations = state.conversations.map((item) =>
    item.otherUserId === otherUserId ? { ...item, blocked } : item,
  );
  writeState(state);
}

function mockMarkRead(conversationId: number): ChatReadResult {
  const state = readState();
  state.conversations = state.conversations.map((item) =>
    item.conversationId === conversationId ? { ...item, unreadCount: 0 } : item,
  );
  writeState(state);
  const messages = state.messages[conversationId] ?? [];
  return {
    conversationId,
    lastReadMessageId: messages.length > 0 ? messages[messages.length - 1]!.messageId : null,
    unreadCount: 0,
  };
}
