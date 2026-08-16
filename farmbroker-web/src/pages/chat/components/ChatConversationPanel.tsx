import { Send } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';

import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingState } from '@/components/common/LoadingState';
import { contextLabel } from '@/pages/chat/chatFilters';
import { getConversation, getMessages, markRead, sendMessage } from '@/services/chatService';
import type { ChatMessage, Conversation } from '@/types/api';
import type { AsyncStatus } from '@/types/common';

interface ChatConversationPanelProps {
  conversationId: number;
  // 내 메시지를 오른쪽에 붙이려면 내가 누구인지 알아야 합니다.
  myUserId: number | null;
  // 위젯 안에서는 높이를 줄여 씁니다.
  compact?: boolean;
}

// 대화 하나를 보여 주고 보내는 패널입니다.
// 전체 화면(/chat/:id)과 우측 하단 미니 위젯이 이 컴포넌트를 함께 씁니다 —
// 두 곳에 같은 로직을 두면 한쪽만 고쳐지는 일이 생깁니다.
export function ChatConversationPanel({
  conversationId,
  myUserId,
  compact = false,
}: ChatConversationPanelProps) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<AsyncStatus>('idle');
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const [room, page] = await Promise.all([
        getConversation(conversationId),
        getMessages(conversationId),
      ]);
      setConversation(room);
      setMessages(page.messages);
      setStatus('success');
      // 방을 열었으면 읽은 것으로 처리해 목록의 안읽음 배지를 정리합니다.
      await markRead(conversationId).catch(() => undefined);
    } catch {
      setStatus('error');
    }
  }, [conversationId]);

  useEffect(() => {
    void load();
  }, [load]);

  // 새 메시지가 붙으면 항상 아래를 보여 줍니다.
  // jsdom에는 scrollIntoView가 없어 존재를 확인하고 부릅니다(테스트 환경 보호).
  useEffect(() => {
    bottomRef.current?.scrollIntoView?.({ block: 'end' });
  }, [messages]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || isSending) return;

    setIsSending(true);
    setError(null);
    try {
      const sent = await sendMessage(conversationId, trimmed);
      setMessages((prev) => [...prev, sent]);
      setText('');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '메시지를 보내지 못했습니다.');
    } finally {
      setIsSending(false);
    }
  }

  if (status === 'loading' || status === 'idle') {
    return <LoadingState label="대화를 불러오는 중입니다" />;
  }
  if (status === 'error' || !conversation) {
    return <ErrorState message="대화를 불러오지 못했습니다" />;
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-2 border-b border-leaf-100 px-4 py-3">
        <Badge tone={conversation.contextType === 'SPACE' ? 'yellow' : 'green'}>
          {contextLabel(conversation.contextType)}
        </Badge>
        <div className="min-w-0">
          <p className="truncate font-bold text-ink-900">{conversation.otherUserNickname}</p>
          <p className="truncate text-xs text-slate-500">{conversation.contextTitle}</p>
        </div>
      </div>

      <div
        className={[
          'min-h-0 flex-1 space-y-2 overflow-y-auto px-4 py-3',
          compact ? 'max-h-72' : '',
        ].join(' ')}
      >
        {messages.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">
            먼저 인사를 건네 보세요.
          </p>
        ) : null}
        {messages.map((message) => {
          const mine = myUserId != null && message.senderId === myUserId;
          return (
            <div
              className={mine ? 'flex justify-end' : 'flex justify-start'}
              key={message.messageId}
            >
              <p
                className={[
                  'max-w-[75%] whitespace-pre-wrap break-words rounded-app px-3 py-2 text-sm',
                  mine ? 'bg-leaf-700 text-white' : 'bg-leaf-50 text-ink-900',
                ].join(' ')}
              >
                {message.text}
              </p>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {error ? (
        <p className="px-4 pb-1 text-sm font-semibold text-feedback-danger" role="alert">
          {error}
        </p>
      ) : null}

      {/* 차단된 상대에게는 서버가 전송을 막으므로 입력창부터 잠급니다. */}
      {conversation.blocked ? (
        <p className="border-t border-leaf-100 px-4 py-3 text-sm text-slate-500">
          차단된 상대와는 대화할 수 없습니다.
        </p>
      ) : (
        <form className="flex gap-2 border-t border-leaf-100 p-3" onSubmit={handleSubmit}>
          <input
            aria-label="메시지 입력"
            className="min-w-0 flex-1 rounded-app border border-leaf-200 px-3 py-2 text-base"
            maxLength={1000}
            onChange={(event) => setText(event.target.value)}
            placeholder="메시지를 입력하세요"
            value={text}
          />
          <Button aria-label="보내기" disabled={isSending || !text.trim()} type="submit">
            <Send className="h-4 w-4" aria-hidden />
          </Button>
        </form>
      )}
    </div>
  );
}
