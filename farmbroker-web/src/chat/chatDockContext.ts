import { createContext, useContext } from 'react';

import type { ChatRealtimeEvent } from '@/chat/useChatSocket';
import type { ChatContextType, Conversation } from '@/types/api';
import type { AsyncStatus } from '@/types/common';

export interface ChatDockValue {
  // 대화를 엽니다. 데스크톱은 우측 하단 위젯, 좁은 화면은 채팅방 화면으로 갑니다.
  openConversation: (conversationId: number) => void;
  // 상품·공간 상세에서 "말 걸기"에 씁니다. 방이 없으면 만들고 있으면 그 방을 엽니다.
  // otherUserId는 공간 주인이 신청자에게 먼저 걸 때만 지정합니다.
  openContext: (
    contextType: ChatContextType,
    contextId: number,
    otherUserId?: number,
  ) => Promise<void>;
  // 소켓으로 실시간 갱신되는 채팅방 목록. 도크와 /chat 이 같은 목록을 봅니다 —
  // 화면마다 따로 받으면 한쪽만 최신이 됩니다.
  conversations: Conversation[];
  conversationsStatus: AsyncStatus;
  // 방금 도착한 실시간 이벤트. 열려 있는 대화 화면이 자기 방 것만 골라 씁니다.
  lastEvent: ChatRealtimeEvent | null;
  // 목록·배지에 쓰는 전체 안 읽은 수.
  totalUnread: number;
  // 보낸 뒤·읽은 뒤 목록을 즉시 맞추고 싶을 때 부릅니다.
  refresh: () => void;
}

export const ChatDockContext = createContext<ChatDockValue | null>(null);

// 프로바이더 밖(로그인 전 화면 등)에서도 안전하게 부를 수 있도록 기본값을 돌려줍니다.
const NOOP: ChatDockValue = {
  openConversation: () => undefined,
  openContext: async () => undefined,
  conversations: [],
  conversationsStatus: 'idle',
  lastEvent: null,
  totalUnread: 0,
  refresh: () => undefined,
};

export function useChatDock(): ChatDockValue {
  return useContext(ChatDockContext) ?? NOOP;
}
