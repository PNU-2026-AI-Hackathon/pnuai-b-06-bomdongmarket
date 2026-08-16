import { MessageCircle } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingState } from '@/components/common/LoadingState';
import { PageHeader } from '@/components/common/PageHeader';
import { PageContainer } from '@/components/layout/PageContainer';
import { ROUTES } from '@/constants/routes';
import { ConversationRow } from '@/pages/chat/components/ConversationRow';
import { CHAT_FILTERS, type ChatFilter, matchesFilter } from '@/pages/chat/chatFilters';
import { getConversations } from '@/services/chatService';
import type { Conversation } from '@/types/api';
import type { AsyncStatus } from '@/types/common';

// 내 채팅방을 모아 보는 화면입니다.
// 공간 문의와 마켓 문의가 한 목록에 섞이면 무엇에 대한 대화인지 헷갈려 탭으로 나눕니다.
export function ChatListPage() {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [status, setStatus] = useState<AsyncStatus>('idle');
  const [filter, setFilter] = useState<ChatFilter>('ALL');

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const result = await getConversations();
      setConversations(result.conversations);
      setStatus('success');
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = conversations.filter((item) => matchesFilter(item, filter));

  return (
    <PageContainer narrow>
      <div className="mb-6">
        <PageHeader
          description="공간 문의와 마켓 문의를 한곳에서 봅니다."
          eyebrow="채팅"
          title="채팅"
        />
      </div>

      {/* 탭은 목록을 거르기만 합니다. 서버는 한 번만 부르고 화면에서 나눕니다. */}
      <div className="mb-4 flex gap-2" role="tablist">
        {CHAT_FILTERS.map((option) => {
          const count = conversations.filter((item) => matchesFilter(item, option.value)).length;
          const selected = filter === option.value;
          return (
            <button
              aria-selected={selected}
              className={[
                'rounded-app px-4 py-2 text-sm font-bold transition duration-ui',
                selected
                  ? 'bg-leaf-700 text-white'
                  : 'border border-leaf-200 bg-white text-slate-600 hover:bg-leaf-50',
              ].join(' ')}
              key={option.value}
              onClick={() => setFilter(option.value)}
              role="tab"
              type="button"
            >
              {option.label} {count}
            </button>
          );
        })}
      </div>

      {status === 'loading' || status === 'idle' ? (
        <LoadingState label="채팅 목록을 불러오는 중입니다" />
      ) : null}
      {status === 'error' ? <ErrorState message="채팅 목록을 불러오지 못했습니다" /> : null}

      {status === 'success' && visible.length === 0 ? (
        <EmptyState
          actionLabel="마켓 둘러보기"
          description="상품이나 공간 상세에서 말을 걸면 여기에 쌓입니다."
          onAction={() => navigate(ROUTES.market)}
          title="아직 대화가 없습니다"
        />
      ) : null}

      {visible.length > 0 ? (
        <ul className="grid gap-3">
          {visible.map((conversation) => (
            <li key={conversation.conversationId}>
              <ConversationRow
                conversation={conversation}
                onOpen={() => navigate(ROUTES.chatRoom(conversation.conversationId))}
              />
            </li>
          ))}
        </ul>
      ) : null}

      {status === 'success' && conversations.length > 0 && visible.length === 0 ? (
        <p className="mt-4 flex items-center gap-2 text-sm text-slate-600">
          <MessageCircle className="h-4 w-4" aria-hidden />이 분류에는 대화가 없습니다.
        </p>
      ) : null}
    </PageContainer>
  );
}
