import { Badge } from '@/components/common/Badge';
import { Card } from '@/components/common/Card';
import { ProductImage } from '@/pages/market/components/ProductImage';
import { contextLabel } from '@/pages/chat/chatFilters';
import type { Conversation } from '@/types/api';
import { formatDate } from '@/utils/format';

interface ConversationRowProps {
  conversation: Conversation;
  onOpen: () => void;
}

// 목록 한 줄. 무엇에 대한 대화인지(공간/마켓)와 안 읽은 수를 먼저 읽히게 둡니다.
export function ConversationRow({ conversation, onOpen }: ConversationRowProps) {
  const hasUnread = conversation.unreadCount > 0;

  return (
    <Card className="overflow-hidden">
      <button
        className="flex w-full items-center gap-3 p-3 text-left transition duration-ui hover:bg-leaf-50"
        onClick={onOpen}
        type="button"
      >
        <ProductImage
          alt={conversation.contextTitle}
          className="h-14 w-14 shrink-0 rounded-app object-cover"
          src={conversation.contextImageUrl}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Badge tone={conversation.contextType === 'SPACE' ? 'yellow' : 'green'}>
              {contextLabel(conversation.contextType)}
            </Badge>
            <span className="truncate font-bold text-ink-900">
              {conversation.otherUserNickname}
            </span>
            {conversation.lastMessageAt ? (
              <span className="ml-auto shrink-0 text-xs text-slate-500">
                {formatDate(conversation.lastMessageAt)}
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 truncate text-sm text-slate-600">{conversation.contextTitle}</p>
          <p className="mt-1 truncate text-sm text-slate-500">
            {conversation.lastMessagePreview ?? '아직 주고받은 메시지가 없습니다.'}
          </p>
        </div>
        {hasUnread ? (
          <span
            aria-label={`안 읽은 메시지 ${conversation.unreadCount}개`}
            className="ml-1 shrink-0 rounded-full bg-feedback-danger px-2 py-0.5 text-xs font-black text-white"
          >
            {conversation.unreadCount}
          </span>
        ) : null}
      </button>
    </Card>
  );
}
