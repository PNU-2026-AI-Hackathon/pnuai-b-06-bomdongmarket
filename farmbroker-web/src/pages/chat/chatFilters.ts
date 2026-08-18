import type { ChatContextType, Conversation } from '@/types/api';

// 공간 문의와 마켓 문의는 대화 성격이 달라 목록에서 갈라 봅니다.
// 서버는 contextType 만 내려주므로 분류 규칙을 여기 한 곳에 둡니다.
export type ChatFilter = 'ALL' | ChatContextType;

export const CHAT_FILTERS: ReadonlyArray<{ value: ChatFilter; label: string }> = [
  { value: 'ALL', label: '전체' },
  { value: 'SPACE', label: '공간' },
  { value: 'PRODUCT', label: '마켓' },
];

export function matchesFilter(conversation: Conversation, filter: ChatFilter): boolean {
  return filter === 'ALL' || conversation.contextType === filter;
}

export function contextLabel(contextType: ChatContextType): string {
  return contextType === 'SPACE' ? '공간' : '마켓';
}
