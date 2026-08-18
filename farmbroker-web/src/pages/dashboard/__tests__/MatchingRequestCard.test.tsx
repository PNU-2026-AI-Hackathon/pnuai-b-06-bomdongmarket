import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ChatDockContext, type ChatDockValue } from '@/chat/chatDockContext';
import { MatchingRequestCard } from '@/pages/dashboard/components/MatchingRequestCard';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { MatchingRequest } from '@/types/api';

// 공간 주인이 보는 카드라, 채팅은 맥락(공간)만으로는 상대를 정할 수 없습니다.
// 신청자를 지목해서 열어야 서버가 CHAT_SELF_CONVERSATION 으로 막지 않습니다.
describe('MatchingRequestCard', () => {
  const request: MatchingRequest = {
    matchingId: 7,
    spaceId: 3,
    spaceTitle: '부산대 앞 20평 상가 공실',
    spaceImageUrl: null,
    farmerId: 42,
    farmerNickname: '도심농부 김민준',
    type: 'PROFIT',
    message: '상추를 재배하고 싶습니다.',
    status: 'REQUESTED',
    createdAt: '2026-07-05T14:00:00',
    respondedAt: null,
  };

  function renderCard(openContext: ChatDockValue['openContext'], onChatOpen?: () => void) {
    const chatDock = {
      openConversation: () => undefined,
      openContext,
      conversations: [],
      conversationsStatus: 'success',
      lastEvent: null,
      totalUnread: 0,
      refresh: () => undefined,
    } satisfies ChatDockValue;

    return renderWithProviders(
      <ChatDockContext.Provider value={chatDock}>
        <MatchingRequestCard onChatOpen={onChatOpen} request={request} />
      </ChatDockContext.Provider>,
    );
  }

  it('채팅 버튼은 신청자를 지목해 공간 문의 방을 연다', async () => {
    const user = userEvent.setup();
    const openContext = vi.fn().mockResolvedValue(undefined);
    renderCard(openContext);

    await user.click(screen.getByRole('button', { name: '채팅' }));

    expect(openContext).toHaveBeenCalledWith('SPACE', 3, 42);
  });

  it('계약서는 해당 매칭의 계약서 화면으로 간다', () => {
    renderCard(vi.fn());

    expect(screen.getByRole('link', { name: '계약서' })).toHaveAttribute(
      'href',
      '/matchings/7/contract',
    );
  });

  // 알림 모달(z-50)이 채팅 도크(z-40)를 덮으므로, 채팅이 열리면 모달이 비켜 줘야 합니다.
  it('채팅이 열리면 감싼 모달을 닫는다', async () => {
    const user = userEvent.setup();
    const onChatOpen = vi.fn();
    renderCard(vi.fn().mockResolvedValue(undefined), onChatOpen);

    await user.click(screen.getByRole('button', { name: '채팅' }));

    expect(onChatOpen).toHaveBeenCalled();
  });

  it('채팅을 열지 못하면 모달을 닫지 않고 이유를 알린다', async () => {
    const user = userEvent.setup();
    const onChatOpen = vi.fn();
    renderCard(
      vi.fn().mockRejectedValue(new Error('차단된 사용자와는 채팅할 수 없습니다.')),
      onChatOpen,
    );

    await user.click(screen.getByRole('button', { name: '채팅' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '차단된 사용자와는 채팅할 수 없습니다.',
    );
    expect(onChatOpen).not.toHaveBeenCalled();
  });
});
