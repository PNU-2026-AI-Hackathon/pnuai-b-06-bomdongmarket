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

  it('사진을 고르면 파일 이름을 보여주고 뺄 수 있다', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ChatConversationPanel conversationId={1} myUserId={1} />);

    await screen.findByText('상추 아직 남아 있나요?');
    await user.upload(
      screen.getByLabelText('사진 선택'),
      new File(['x'], 'lettuce.jpg', { type: 'image/jpeg' }),
    );

    expect(await screen.findByText('lettuce.jpg')).toBeInTheDocument();
    // 사진만 있어도 보낼 수 있어야 한다
    expect(screen.getByRole('button', { name: '보내기' })).toBeEnabled();

    await user.click(screen.getByRole('button', { name: '사진 빼기' }));
    expect(screen.queryByText('lettuce.jpg')).not.toBeInTheDocument();
  });

  // 목업 대화에는 메시지가 2건뿐이라 더 불러올 것이 없다.
  it('더 불러올 이전 메시지가 없으면 버튼을 두지 않는다', async () => {
    renderWithProviders(<ChatConversationPanel conversationId={1} myUserId={1} />);

    await screen.findByText('상추 아직 남아 있나요?');
    expect(screen.queryByRole('button', { name: /이전 메시지 더 보기/ })).not.toBeInTheDocument();
  });

  it('차단하면 입력창이 잠긴다', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ChatConversationPanel conversationId={1} myUserId={1} />);

    await screen.findByText('상추 아직 남아 있나요?');
    await user.click(screen.getByRole('button', { name: '이 사용자 차단' }));

    expect(await screen.findByText(/차단된 상대와는 대화할 수 없습니다/)).toBeInTheDocument();
    expect(screen.queryByLabelText('메시지 입력')).not.toBeInTheDocument();
  });
});
