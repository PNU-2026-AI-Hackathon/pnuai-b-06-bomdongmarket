import { useCallback, useEffect, useRef, useState } from 'react';

import { getConversations } from '@/services/chatService';
import type { Conversation } from '@/types/api';

const POLL_INTERVAL_MS = 5000;

export interface IncomingMessage {
  conversationId: number;
  from: string;
  preview: string;
}

// 채팅방 목록을 주기적으로 다시 받아 새 메시지를 감지합니다.
//
// 서버는 STOMP(/ws-chat)로 실시간 이벤트를 보내지만 프런트에 STOMP 클라이언트를 아직 들이지
// 않아 폴링으로 대신합니다. 실시간으로 바꿀 때 이 훅만 갈아 끼우면 되도록,
// 바깥에는 "목록"과 "새로 들어온 메시지" 두 가지만 노출합니다.
export function useChatPolling(enabled: boolean, onIncoming: (message: IncomingMessage) => void) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  // 직전 안읽음 수를 들고 있다가 늘어난 방만 새 메시지로 봅니다.
  const lastUnreadRef = useRef<Map<number, number> | null>(null);
  const onIncomingRef = useRef(onIncoming);
  onIncomingRef.current = onIncoming;

  const pull = useCallback(async () => {
    try {
      const result = await getConversations();
      setConversations(result.conversations);

      const previous = lastUnreadRef.current;
      const current = new Map(
        result.conversations.map((item) => [item.conversationId, item.unreadCount]),
      );
      // 첫 응답은 기준선으로만 씁니다. 이걸 알림으로 띄우면 새로고침마다 밀린 알림이 쏟아집니다.
      if (previous) {
        result.conversations.forEach((item) => {
          const before = previous.get(item.conversationId) ?? 0;
          if (item.unreadCount > before) {
            onIncomingRef.current({
              conversationId: item.conversationId,
              from: item.otherUserNickname,
              preview: item.lastMessagePreview ?? '새 메시지가 도착했습니다.',
            });
          }
        });
      }
      lastUnreadRef.current = current;
    } catch {
      // 폴링 실패는 조용히 넘깁니다 — 다음 주기에 다시 시도합니다.
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      lastUnreadRef.current = null;
      setConversations([]);
      return;
    }
    void pull();
    const timer = window.setInterval(() => void pull(), POLL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [enabled, pull]);

  const totalUnread = conversations.reduce((sum, item) => sum + item.unreadCount, 0);

  return { conversations, totalUnread, refresh: pull };
}
