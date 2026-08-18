import { ImagePlus, Send, Ban, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';

import { useChatDock } from '@/chat/chatDockContext';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingState } from '@/components/common/LoadingState';
import { RemoteImage } from '@/components/common/RemoteImage';
import { APP_INFO } from '@/constants/appInfo';
import { contextLabel } from '@/pages/chat/chatFilters';
import { ENDPOINTS } from '@/api/endpoints';
import {
  blockUser,
  getConversation,
  getMessages,
  markRead,
  sendMessage,
  unblockUser,
} from '@/services/chatService';
import { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_SIZE_BYTES, isAcceptedImage } from '@/services/fileService';
import type { ChatMessage, Conversation } from '@/types/api';
import type { AsyncStatus } from '@/types/common';

interface ChatConversationPanelProps {
  conversationId: number;
  // 내 메시지를 오른쪽에 붙이려면 내가 누구인지 알아야 합니다.
  myUserId: number | null;
  // 위젯 안에서는 높이를 줄여 씁니다.
  compact?: boolean;
}

// 이미지 메시지는 인증이 필요한 경로라 <img src> 로 직접 부릅니다(쿠키가 함께 나갑니다).
function imageUrl(messageId: number): string {
  return `${APP_INFO.baseUrl}${ENDPOINTS.chat.messageImage(messageId)}`;
}

// 내가 보낸 메시지는 두 경로로 들어옵니다 — 전송 API 응답과, 서버가 보낸 사람에게도 주는
// MESSAGE_CREATED 이벤트(ChatRealtimePublisher 가 참가자 둘 다에게 보냅니다).
// 어느 쪽이 먼저 도착할지 정해져 있지 않아 양쪽 모두 messageId 로 걸러야 합니다.
function appendUnique(previous: ChatMessage[], message: ChatMessage): ChatMessage[] {
  return previous.some((item) => item.messageId === message.messageId)
    ? previous
    : [...previous, message];
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
  const [image, setImage] = useState<File | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 위로 더 불러올 커서. null 이면 더 없습니다.
  const [beforeId, setBeforeId] = useState<number | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { lastEvent, refresh: refreshConversations } = useChatDock();

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const [room, page] = await Promise.all([
        getConversation(conversationId),
        getMessages(conversationId),
      ]);
      setConversation(room);
      setMessages(page.messages);
      setBeforeId(page.hasNext ? page.nextBeforeId : null);
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

  // 보고 있는 방에 새 메시지가 오면 바로 붙입니다.
  // 소켓은 도크에 하나만 열려 있어 이벤트를 컨텍스트로 받아 내 방 것만 고릅니다.
  // 내가 보낸 메시지도 같은 큐로 돌아오므로 messageId 로 중복을 막습니다.
  useEffect(() => {
    if (!lastEvent || lastEvent.conversationId !== conversationId) return;
    const incoming = lastEvent.message;
    if (!incoming) return;

    setMessages((prev) => appendUnique(prev, incoming));

    // 지금 보고 있는 방이므로 읽음으로 처리합니다 — 아니면 안읽음 배지가 계속 올라갑니다.
    // 내가 보낸 메시지에는 부르지 않습니다(읽을 것이 없습니다).
    if (myUserId != null && incoming.senderId === myUserId) return;
    void markRead(conversationId)
      .then(() => refreshConversations())
      .catch(() => undefined);
  }, [conversationId, lastEvent, myUserId, refreshConversations]);

  // 새 메시지가 붙으면 항상 아래를 보여 줍니다.
  // jsdom에는 scrollIntoView가 없어 존재를 확인하고 부릅니다(테스트 환경 보호).
  // 위로 더 불러올 때는 읽던 자리가 튀므로 내리지 않습니다.
  useEffect(() => {
    if (isLoadingMore) return;
    bottomRef.current?.scrollIntoView?.({ block: 'end' });
  }, [isLoadingMore, messages]);

  async function handleLoadMore() {
    if (beforeId == null || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const page = await getMessages(conversationId, beforeId);
      // 위로 붙입니다 — 서버는 오래된 것부터 정렬해 돌려줍니다.
      setMessages((prev) => [...page.messages, ...prev]);
      setBeforeId(page.hasNext ? page.nextBeforeId : null);
    } catch {
      setError('이전 메시지를 불러오지 못했습니다.');
    } finally {
      setIsLoadingMore(false);
    }
  }

  function handlePickImage(event: ChangeEvent<HTMLInputElement>) {
    const picked = event.target.files?.[0];
    // 같은 파일을 다시 고를 수 있도록 값을 비웁니다.
    event.target.value = '';
    if (!picked) return;
    if (!isAcceptedImage(picked)) {
      setError('jpg, png, webp, gif 이미지만 보낼 수 있습니다.');
      return;
    }
    if (picked.size > MAX_IMAGE_SIZE_BYTES) {
      setError('사진은 5MB 이하만 보낼 수 있습니다.');
      return;
    }
    setError(null);
    setImage(picked);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = text.trim();
    if ((!trimmed && !image) || isSending) return;

    setIsSending(true);
    setError(null);
    try {
      const sent = await sendMessage(conversationId, trimmed, image);
      // 소켓 이벤트가 응답보다 먼저 도착했으면 이미 붙어 있습니다.
      setMessages((prev) => appendUnique(prev, sent));
      setText('');
      setImage(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '메시지를 보내지 못했습니다.');
    } finally {
      setIsSending(false);
    }
  }

  async function handleToggleBlock() {
    if (!conversation) return;
    setIsBlocking(true);
    setError(null);
    try {
      if (conversation.blocked) {
        await unblockUser(conversation.otherUserId);
      } else {
        await blockUser(conversation.otherUserId);
      }
      // 차단 여부는 서버가 판단하므로 방 정보를 다시 받습니다
      // (상대가 나를 차단한 경우 내가 풀 수 없습니다).
      setConversation(await getConversation(conversationId));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '차단 상태를 바꾸지 못했습니다.');
    } finally {
      setIsBlocking(false);
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
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold text-ink-900">{conversation.otherUserNickname}</p>
          <p className="truncate text-xs text-slate-500">{conversation.contextTitle}</p>
        </div>
        <Button
          aria-label={conversation.blocked ? '차단 해제' : '이 사용자 차단'}
          disabled={isBlocking}
          onClick={() => void handleToggleBlock()}
          size="sm"
          variant="ghost"
        >
          <Ban className="h-4 w-4" aria-hidden />
        </Button>
      </div>

      <div
        className={[
          'min-h-0 flex-1 space-y-2 overflow-y-auto px-4 py-3',
          compact ? 'max-h-72' : '',
        ].join(' ')}
      >
        {beforeId != null ? (
          <Button
            className="w-full"
            disabled={isLoadingMore}
            onClick={() => void handleLoadMore()}
            size="sm"
            variant="ghost"
          >
            {isLoadingMore ? '불러오는 중...' : '이전 메시지 더 보기'}
          </Button>
        ) : null}

        {messages.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">먼저 인사를 건네 보세요.</p>
        ) : null}
        {messages.map((message) => {
          const mine = myUserId != null && message.senderId === myUserId;
          return (
            <div
              className={mine ? 'flex justify-end' : 'flex justify-start'}
              key={message.messageId}
            >
              <div
                className={[
                  'max-w-[75%] overflow-hidden rounded-app',
                  mine ? 'bg-leaf-700 text-white' : 'bg-leaf-50 text-ink-900',
                ].join(' ')}
              >
                {message.type === 'IMAGE' ? (
                  <RemoteImage
                    alt="보낸 사진"
                    className="max-h-60 w-full object-cover"
                    src={imageUrl(message.messageId)}
                  />
                ) : null}
                {message.text ? (
                  <p className="whitespace-pre-wrap break-words px-3 py-2 text-sm">
                    {message.text}
                  </p>
                ) : null}
              </div>
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
          차단된 상대와는 대화할 수 없습니다. 위 차단 버튼으로 해제할 수 있습니다.
        </p>
      ) : (
        <form className="border-t border-leaf-100 p-3" onSubmit={handleSubmit}>
          {image ? (
            <div className="mb-2 flex items-center gap-2 rounded-app bg-leaf-50 px-3 py-2">
              <span className="min-w-0 flex-1 truncate text-sm text-slate-600">{image.name}</span>
              <button
                aria-label="사진 빼기"
                className="rounded-app p-1 text-slate-500 hover:bg-white"
                onClick={() => setImage(null)}
                type="button"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
          ) : null}
          <div className="flex gap-2">
            <input
              accept={ACCEPTED_IMAGE_TYPES}
              aria-label="사진 선택"
              className="sr-only"
              onChange={handlePickImage}
              ref={fileRef}
              type="file"
            />
            <Button
              aria-label="사진 첨부"
              onClick={() => fileRef.current?.click()}
              type="button"
              variant="outline"
            >
              <ImagePlus className="h-4 w-4" aria-hidden />
            </Button>
            <input
              aria-label="메시지 입력"
              className="min-w-0 flex-1 rounded-app border border-leaf-200 px-3 py-2 text-base"
              maxLength={1000}
              onChange={(event) => setText(event.target.value)}
              placeholder="메시지를 입력하세요"
              value={text}
            />
            <Button
              aria-label="보내기"
              disabled={isSending || (!text.trim() && !image)}
              type="submit"
            >
              <Send className="h-4 w-4" aria-hidden />
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
