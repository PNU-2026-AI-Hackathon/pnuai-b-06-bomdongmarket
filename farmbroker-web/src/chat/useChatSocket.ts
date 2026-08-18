import { Client, type IMessage } from '@stomp/stompjs';
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

// 채팅방 목록을 들고 있으면서 새 메시지를 실시간으로 받습니다.
//
// 목록 자체는 REST 로 한 번 받습니다. 소켓 이벤트에는 방 제목·상대 닉네임처럼 목록을 그리는 데
// 필요한 정보가 없고, 접속 이전에 쌓인 것도 알 수 없기 때문입니다.
// 이후로는 이벤트로만 갱신하고, 연결이 끊겼다 붙으면 놓친 사이를 메우려 다시 받습니다.
export function useChatSocket(enabled: boolean, onIncoming: (message: IncomingMessage) => void) {
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

    try {
      const result = await getConversations();
      if (!activeRef.current || !enabledRef.current) return;
      setConversations(result.conversations);
      setStatus('success');
    } catch {
      if (!activeRef.current || !enabledRef.current) return;
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

    setStatus((prev) => (prev === 'success' ? prev : 'loading'));
    void refresh();

    const client = new Client({
      brokerURL: resolveSocketUrl(),
      // 인증은 handshake 의 JWT 쿠키로 이뤄집니다(SecurityConfig 가 /ws-chat 을 보호).
      reconnectDelay: 3000,
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
  }, [applyEvent, enabled, refresh]);

  const totalUnread = conversations.reduce((sum, item) => sum + item.unreadCount, 0);

  return { conversations, status, lastEvent, totalUnread, refresh };
}
