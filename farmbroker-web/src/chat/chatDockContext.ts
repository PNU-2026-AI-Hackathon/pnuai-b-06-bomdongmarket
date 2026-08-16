import { createContext, useContext } from 'react';

import type { ChatContextType } from '@/types/api';

export interface ChatDockValue {
  // 대화를 우측 하단 위젯으로 엽니다. 페이지 이동 없이 이어서 볼 수 있습니다.
  openConversation: (conversationId: number) => void;
  // 상품·공간 상세에서 "말 걸기"에 씁니다. 방이 없으면 만들고 있으면 그 방을 엽니다.
  openContext: (contextType: ChatContextType, contextId: number) => Promise<void>;
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
  totalUnread: 0,
  refresh: () => undefined,
};

export function useChatDock(): ChatDockValue {
  return useContext(ChatDockContext) ?? NOOP;
}
