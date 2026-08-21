import { MessageCircle } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useChatDock } from '@/chat/chatDockContext';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingState } from '@/components/common/LoadingState';
import { PageHeader } from '@/components/common/PageHeader';
import { PageContainer } from '@/components/layout/PageContainer';
import { ROUTES } from '@/constants/routes';
import { ConversationRow } from '@/pages/chat/components/ConversationRow';
import { CHAT_FILTERS, type ChatFilter, matchesFilter } from '@/pages/chat/chatFilters';

// 내 채팅방을 모아 보는 화면입니다.
// 공간 문의와 마켓 문의가 한 목록에 섞이면 무엇에 대한 대화인지 헷갈려 탭으로 나눕니다.
//
// 목록은 도크가 들고 있는 소켓 목록을 그대로 씁니다. 여기서 따로 받으면 화면을 켜 둔 동안
// 새 메시지가 와도 미리보기·안읽음·정렬이 그대로 멈춰 있습니다.
export function ChatListPage() {
  const navigate = useNavigate();
  const { conversations, conversationsStatus: status, refresh } = useChatDock();
  const [filter, setFilter] = useState<ChatFilter>('ALL');

  const visible = conversations.filter((item) => matchesFilter(item, filter));
  // 대화가 아예 없는 것과, 고른 탭에만 없는 것은 다른 상황입니다.
  // 둘을 따로 가리지 않으면 공간 탭이 비었을 때 "대화가 없습니다" 안내와 마켓 둘러보기
  // 버튼이 아래 "이 분류에는 대화가 없습니다" 와 함께 겹쳐 나옵니다.
  const isEmpty = status === 'success' && conversations.length === 0;
  const isFilteredOut = status === 'success' && conversations.length > 0 && visible.length === 0;

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
      {status === 'error' ? (
        <ErrorState message="채팅 목록을 불러오지 못했습니다" onRetry={refresh} />
      ) : null}

      {isEmpty ? (
        <EmptyState
          actionLabel="마켓 둘러보기"
          description="상품이나 공간 상세에서 말을 걸면 여기에 쌓입니다."
          onAction={() => navigate(ROUTES.market)}
          title="아직 대화가 없습니다"
        />
      ) : null}

      {/* 그리드 항목은 min-width:auto 라 내용보다 작아지지 않는다.
          아래 li 의 min-w-0 이 없으면 긴 미리보기가 줄을 밀어 화면 밖으로 넘친다. */}
      {visible.length > 0 ? (
        <ul className="grid gap-3">
          {visible.map((conversation) => (
            <li className="min-w-0" key={conversation.conversationId}>
              <ConversationRow
                conversation={conversation}
                onOpen={() => navigate(ROUTES.chatRoom(conversation.conversationId))}
              />
            </li>
          ))}
        </ul>
      ) : null}

      {/* 다른 탭에는 대화가 있으니 시작하라고 권하지 않고 어디를 보면 되는지만 알립니다. */}
      {isFilteredOut ? (
        <p className="mt-4 flex items-center gap-2 text-sm text-slate-600">
          <MessageCircle className="h-4 w-4" aria-hidden />이 분류에는 대화가 없습니다. 다른 탭을
          확인해 보세요.
        </p>
      ) : null}
    </PageContainer>
  );
}
