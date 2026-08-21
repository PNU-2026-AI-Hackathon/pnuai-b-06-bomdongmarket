import { ChevronDown, MessageCircle, X } from 'lucide-react';
import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '@/auth/authContext';
import { ToastHost, type ToastItem } from '@/components/common/Toast';
import { ROUTES } from '@/constants/routes';
import { ChatDockContext, type ChatDockValue } from '@/chat/chatDockContext';
import { useChatSocket, type IncomingMessage } from '@/chat/useChatSocket';
import { ChatConversationPanel } from '@/pages/chat/components/ChatConversationPanel';
import { ConversationRow } from '@/pages/chat/components/ConversationRow';
import { createOrGetConversation } from '@/services/chatService';
import type { ChatContextType } from '@/types/api';

type DockState = 'hidden' | 'minimized' | 'open';

// 도크는 lg(1024px) 이상에서만 뜹니다. 좁은 화면에서 방만 열면 화면에 아무것도 나오지
// 않아 "판매자와 채팅"을 눌러도 무반응으로 보입니다 — 그때는 채팅방 화면으로 보냅니다.
function isNarrowScreen(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(max-width: 1023px)').matches;
}

// 화면 어디서나 채팅을 이어 볼 수 있는 우측 하단 위젯입니다.
// 라우트 안에 두면 페이지를 옮길 때 대화가 끊겨서 레이아웃 수준에 둡니다.
//
// 새 메시지는 서버가 /user/queue/chat-events 로 밀어 주고, 받으면 토스트로 띄웁니다.
export function ChatDockProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dockState, setDockState] = useState<DockState>('hidden');
  const [activeId, setActiveId] = useState<number | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const openConversation = useCallback(
    (conversationId: number) => {
      if (isNarrowScreen()) {
        navigate(ROUTES.chatRoom(conversationId));
        return;
      }
      setActiveId(conversationId);
      setDockState('open');
    },
    [navigate],
  );

  // 지금 화면에 보이고 있는 대화 — 채팅방 경로이거나, 도크가 그 방을 열어 둔 경우입니다.
  const roomMatch = /^\/chat\/(\d+)$/.exec(location.pathname);
  const viewingId = roomMatch
    ? Number(roomMatch[1])
    : dockState === 'open' && activeId != null
      ? activeId
      : null;

  const handleIncoming = useCallback(
    (message: IncomingMessage) => {
      // 읽고 있는 대화의 메시지는 화면에 바로 붙으므로 토스트까지 띄우지 않습니다.
      if (message.conversationId === viewingId) return;
      setToasts((prev) => [
        ...prev,
        {
          // 같은 밀리초에 두 건이 와도 키가 겹치지 않도록 방 번호를 섞습니다.
          id: Date.now() * 1000 + (message.conversationId % 1000),
          title: `${message.from}님의 새 메시지`,
          description: message.preview,
          onClick: () => openConversation(message.conversationId),
        },
      ]);
    },
    [openConversation, viewingId],
  );

  const { conversations, status, lastEvent, totalUnread, refresh } = useChatSocket(
    isAuthenticated,
    user?.userId ?? null,
    handleIncoming,
  );

  const openContext = useCallback(
    async (contextType: ChatContextType, contextId: number, otherUserId?: number) => {
      const conversation = await createOrGetConversation(contextType, contextId, otherUserId);
      openConversation(conversation.conversationId);
      refresh();
    },
    [openConversation, refresh],
  );

  const value = useMemo<ChatDockValue>(
    () => ({
      openConversation,
      openContext,
      conversations,
      conversationsStatus: status,
      lastEvent,
      totalUnread,
      refresh,
    }),
    [openConversation, openContext, conversations, status, lastEvent, totalUnread, refresh],
  );

  return (
    <ChatDockContext.Provider value={value}>
      {children}
      <ToastHost onDismiss={dismissToast} toasts={toasts} />

      {isAuthenticated ? (
        // 모바일에서는 하단 탭과 겹쳐 방해가 되므로 데스크톱에서만 띄웁니다.
        <div className="fixed bottom-4 right-4 z-40 hidden lg:block">
          {dockState === 'open' ? (
            <div className="flex h-[28rem] w-80 flex-col overflow-hidden rounded-app border border-leaf-100 bg-white shadow-lift">
              <div className="flex items-center gap-1 border-b border-leaf-100 px-3 py-2">
                <span className="flex-1 text-sm font-black text-ink-900">
                  {activeId ? '대화' : '채팅'}
                </span>
                {activeId ? (
                  <button
                    className="rounded-app px-2 py-1 text-xs font-bold text-leaf-700 transition duration-ui hover:bg-leaf-50"
                    onClick={() => setActiveId(null)}
                    type="button"
                  >
                    목록
                  </button>
                ) : null}
                <button
                  aria-label="채팅 최소화"
                  className="rounded-app p-1 text-slate-500 transition duration-ui hover:bg-leaf-50"
                  onClick={() => setDockState('minimized')}
                  type="button"
                >
                  <ChevronDown className="h-4 w-4" aria-hidden />
                </button>
                <button
                  aria-label="채팅 닫기"
                  className="rounded-app p-1 text-slate-500 transition duration-ui hover:bg-leaf-50"
                  onClick={() => setDockState('hidden')}
                  type="button"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              </div>

              {activeId ? (
                <ChatConversationPanel compact conversationId={activeId} myUserId={user?.userId ?? null} />
              ) : (
                <div className="min-h-0 flex-1 overflow-y-auto p-2">
                  {conversations.length === 0 ? (
                    <p className="py-8 text-center text-sm text-slate-500">
                      아직 대화가 없습니다.
                    </p>
                  ) : (
                    <ul className="grid gap-2">
                      {conversations.map((conversation) => (
                        <li className="min-w-0" key={conversation.conversationId}>
                          <ConversationRow
                            conversation={conversation}
                            onOpen={() => setActiveId(conversation.conversationId)}
                          />
                        </li>
                      ))}
                    </ul>
                  )}
                  <button
                    className="mt-2 w-full rounded-app px-3 py-2 text-sm font-bold text-leaf-700 transition duration-ui hover:bg-leaf-50"
                    onClick={() => {
                      setDockState('hidden');
                      navigate(ROUTES.chat);
                    }}
                    type="button"
                  >
                    전체 화면으로 보기
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              aria-label={totalUnread > 0 ? `채팅 열기, 안 읽은 메시지 ${totalUnread}개` : '채팅 열기'}
              className="relative flex h-14 w-14 items-center justify-center rounded-full bg-leaf-700 text-white shadow-lift transition duration-ui hover:bg-leaf-800"
              onClick={() => setDockState('open')}
              type="button"
            >
              <MessageCircle className="h-6 w-6" aria-hidden />
              {totalUnread > 0 ? (
                <span className="absolute -right-1 -top-1 rounded-full bg-feedback-danger px-2 py-0.5 text-xs font-black">
                  {totalUnread}
                </span>
              ) : null}
            </button>
          )}
        </div>
      ) : null}
    </ChatDockContext.Provider>
  );
}
