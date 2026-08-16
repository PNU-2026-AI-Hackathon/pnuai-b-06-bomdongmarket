import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

import { ChatConversationPanel } from '@/pages/chat/components/ChatConversationPanel';
import { getConversations } from '@/services/chatService';
import { renderWithProviders } from '@/test/renderWithProviders';

// 목업 1번 방에는 내(1번) 메시지와 상대(20번) 메시지가 한 건씩 들어 있다.
describe('ChatConversationPanel', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it('주고받은 메시지를 보여준다', async () => {
    renderWithProviders(<ChatConversationPanel conversationId={1} myUserId={1} />);

    expect(await screen.findByText('상추 아직 남아 있나요?')).toBeInTheDocument();
    expect(screen.getByText('내일 수확분으로 보내드릴 수 있어요.')).toBeInTheDocument();
  });

  it('메시지를 보내면 목록 끝에 붙는다', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ChatConversationPanel conversationId={1} myUserId={1} />);

    await screen.findByText('상추 아직 남아 있나요?');
    await user.type(screen.getByLabelText('메시지 입력'), '금요일에 받을 수 있을까요?');
    await user.click(screen.getByRole('button', { name: '보내기' }));

    expect(await screen.findByText('금요일에 받을 수 있을까요?')).toBeInTheDocument();
  });

  it('빈 메시지는 보낼 수 없다', async () => {
    renderWithProviders(<ChatConversationPanel conversationId={1} myUserId={1} />);

    await screen.findByText('상추 아직 남아 있나요?');
    expect(screen.getByRole('button', { name: '보내기' })).toBeDisabled();
  });

  // 방을 열면 읽음 처리가 함께 나가 목록의 안읽음 배지가 정리돼야 한다.
  it('방을 열면 안 읽은 수가 0이 된다', async () => {
    renderWithProviders(<ChatConversationPanel conversationId={1} myUserId={1} />);

    await screen.findByText('상추 아직 남아 있나요?');

    await waitFor(async () => {
      const list = await getConversations();
      const room = list.conversations.find((item) => item.conversationId === 1);
      expect(room?.unreadCount).toBe(0);
    });
  });
});
