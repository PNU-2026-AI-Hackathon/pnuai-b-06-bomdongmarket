import { Client, ReconnectionTimeMode, type IMessage } from '@stomp/stompjs';
import { useCallback, useEffect, useRef, useState } from 'react';

import { APP_INFO } from '@/constants/appInfo';
import { getConversations } from '@/services/chatService';
import type { ChatMessage, Conversation } from '@/types/api';
import type { AsyncStatus } from '@/types/common';

export interface IncomingMessage {
  conversationId: number;
  from: string;
  preview: string;
}

// 서버가 사용자별 큐로 밀어 주는 이벤트입니다(ChatRealtimePublisher).
export interface ChatRealtimeEvent {
  type: string;
  conversationId: number;
  message: ChatMessage | null;
  unreadCount: number;
}

// 소켓 주소는 API 주소에서 끌어냅니다.
// 프런트는 nginx(5173)가 서빙하고 API 는 8080/api 라, 화면 오리진으로 만들면
// nginx 에 없는 경로로 붙어 연결이 되지 않습니다. STOMP 엔드포인트는 백엔드
// 컨텍스트 경로 아래에 있어 최종 주소가 ws://host:8080/api/ws-chat 이 됩니다.
function resolveSocketUrl(): string {
  const configured = import.meta.env.VITE_WS_URL as string | undefined;
  if (configured) return configured;
  const url = new URL(APP_INFO.baseUrl, window.location.origin);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  url.pathname = `${url.pathname.replace(/\/$/, '')}/ws-chat`;
  return url.toString();
}

// 서버는 목록을 페이지로 나눠 줍니다. 첫 장만 받으면 21번째 방부터는 화면에도,
// 탭 개수와 안읽음 배지에도 들어가지 않아 그 방에 새 메시지가 와도 아무 표시가 나지 않습니다.
// hasNext 가 false 가 될 때까지 이어 받되, 서버가 계속 true 를 주는 경우를 대비해 상한을 둡니다.
const MAX_CONVERSATION_PAGES = 25;

// 핸드셰이크가 막히면 stompjs 는 같은 간격으로 무한히 다시 붙습니다. 저절로 낫지 않는
// 실패(Origin 거절 등)에서는 3초에 한 줄씩 콘솔이 실패 로그로 가득 찹니다.
// 간격을 두 배씩 늘려 1분에서 멈추게 합니다 — 포기하지는 않으므로 서버가 깨어나면
// (Render 는 유휴 상태에서 내려갑니다) 새로고침 없이 다시 붙습니다.
const RECONNECT_DELAY_MS = 3000;
const MAX_RECONNECT_DELAY_MS = 60000;

// 페이지를 넘기는 사이 로그아웃이나 계정 전환이 일어나면 남은 장을 받지 않고 null 로 물러납니다.
async function fetchAllConversations(isStale: () => boolean): Promise<Conversation[] | null> {
  const collected: Conversation[] = [];
  for (let page = 0; page < MAX_CONVERSATION_PAGES; page += 1) {
    const result = await getConversations(page);
    if (isStale()) return null;
    collected.push(...result.conversations);
    if (!result.hasNext) break;
  }
  return collected;
}

// 채팅방 목록을 들고 있으면서 새 메시지를 실시간으로 받습니다.
//
// 목록 자체는 REST 로 받습니다. 소켓 이벤트에는 방 제목·상대 닉네임처럼 목록을 그리는 데
// 필요한 정보가 없고, 접속 이전에 쌓인 것도 알 수 없기 때문입니다.
// 이후로는 이벤트로만 갱신하고, 연결이 끊겼다 붙으면 놓친 사이를 메우려 다시 받습니다.
export function useChatSocket(
  enabled: boolean,
  // 지금 로그인한 사람. 응답이 늦게 도착했을 때 그 사이 계정이 바뀌었는지 가릅니다 —
  // 로그아웃 직후 다른 계정으로 들어오면 enabled 는 계속 true 라 그 검사만으로는
  // 앞 계정의 목록이 새 계정 화면에 그대로 앉습니다.
  userId: number | null,
  onIncoming: (message: IncomingMessage) => void,
) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [status, setStatus] = useState<AsyncStatus>('idle');
  // 열려 있는 대화 화면이 자기 방 메시지를 골라 붙일 수 있도록 마지막 이벤트를 그대로 내보냅니다.
  // 소켓을 화면마다 따로 열면 연결이 여러 개 생기고 읽음 처리도 어긋납니다.
  const [lastEvent, setLastEvent] = useState<ChatRealtimeEvent | null>(null);
  const onIncomingRef = useRef(onIncoming);
  onIncomingRef.current = onIncoming;
  const activeRef = useRef(false);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;
  const userIdRef = useRef(userId);
  userIdRef.current = userId;
  // 이벤트 처리 중 최신 목록이 필요해 ref 로도 들고 있습니다(구독 콜백이 상태를 닫아 버립니다).
  const conversationsRef = useRef<Conversation[]>([]);
  conversationsRef.current = conversations;

  useEffect(() => {
    activeRef.current = true;
    return () => {
      activeRef.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    if (!activeRef.current || !enabledRef.current) return;
    // 요청을 시작한 계정입니다. 끝났을 때 값이 달라져 있으면 남의 목록입니다.
    const requestedBy = userIdRef.current;
    const isStale = () =>
      !activeRef.current || !enabledRef.current || userIdRef.current !== requestedBy;

    try {
      const collected = await fetchAllConversations(isStale);
      if (collected === null) return;
      setConversations(collected);
      setStatus('success');
    } catch {
      if (isStale()) return;
      // 한 번이라도 받아 둔 목록이 있으면 화면을 지우지 않습니다 —
      // 다음 이벤트나 재연결에서 다시 맞춰집니다.
      setStatus((prev) => (prev === 'success' ? prev : 'error'));
    }
  }, []);

  const applyEvent = useCallback((event: ChatRealtimeEvent) => {
    setLastEvent(event);
    const current = conversationsRef.current;
    const room = current.find((item) => item.conversationId === event.conversationId);

    // 처음 보는 방이면 목록에 없는 정보(제목·상대)가 필요해 다시 받아옵니다.
    if (!room) {
      void refreshRef.current();
      return;
    }

    setConversations(
      current
        .map((item) =>
          item.conversationId === event.conversationId
            ? {
                ...item,
                unreadCount: event.unreadCount,
                lastMessagePreview: event.message?.text ?? item.lastMessagePreview,
                lastMessageAt: event.message?.createdAt ?? item.lastMessageAt,
              }
            : item,
        )
        .sort((a, b) => (b.lastMessageAt ?? '').localeCompare(a.lastMessageAt ?? '')),
    );

    // 안 읽은 수가 늘었을 때만 알립니다. 내가 보낸 메시지나 읽음 처리로는 띄우지 않습니다.
    if (event.unreadCount > room.unreadCount) {
      onIncomingRef.current({
        conversationId: event.conversationId,
        from: room.otherUserNickname,
        preview: event.message?.text ?? '새 메시지가 도착했습니다.',
      });
    }
  }, []);

  // applyEvent 가 refresh 를 부르되 서로를 의존성에 넣지 않도록 ref 로 끊습니다.
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;

  useEffect(() => {
    if (!enabled) {
      setConversations([]);
      setStatus('idle');
      return;
    }

    // 계정이 바뀌었을 수도 있어 앞 계정의 목록을 남기지 않습니다 —
    // 방 제목과 상대 닉네임이 남의 것이라 한 틱이라도 보이면 그대로 사고입니다.
    setConversations([]);
    setStatus('loading');
    void refresh();

    const client = new Client({
      brokerURL: resolveSocketUrl(),
      // 인증은 handshake 의 JWT 쿠키로 이뤄집니다(SecurityConfig 가 /ws-chat 을 보호).
      reconnectDelay: RECONNECT_DELAY_MS,
      reconnectTimeMode: ReconnectionTimeMode.EXPONENTIAL,
      maxReconnectDelay: MAX_RECONNECT_DELAY_MS,
      onConnect: () => {
        client.subscribe('/user/queue/chat-events', (frame: IMessage) => {
          try {
            applyEvent(JSON.parse(frame.body) as ChatRealtimeEvent);
          } catch {
            // 알 수 없는 형식은 무시합니다.
          }
        });
        // 끊겼던 동안 놓친 메시지가 있을 수 있어 붙을 때마다 목록을 맞춥니다.
        void refresh();
      },
    });

    client.activate();
    return () => {
      void client.deactivate();
    };
    // userId 가 바뀌면 소켓도 새 계정 쿠키로 다시 붙어야 합니다.
  }, [applyEvent, enabled, refresh, userId]);

  const totalUnread = conversations.reduce((sum, item) => sum + item.unreadCount, 0);

  return { conversations, status, lastEvent, totalUnread, refresh };
}
