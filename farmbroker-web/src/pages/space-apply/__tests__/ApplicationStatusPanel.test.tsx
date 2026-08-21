import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ChatDockContext, type ChatDockValue } from '@/chat/chatDockContext';
import { ApplicationStatusPanel } from '@/pages/space-apply/components/ApplicationStatusPanel';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { MyMatching } from '@/types/api';

const application: MyMatching = {
  matchingId: 7,
  spaceId: 3,
  spaceTitle: '부산대 앞 20평 상가 공실',
  spaceImageUrl: null,
  monthlyRent: 800000,
  ownerNickname: '공실주인',
  type: 'PROFIT',
  message: '스마트팜을 들이고 싶습니다.',
  status: 'REQUESTED',
  createdAt: '2026-08-19T09:00:00',
  respondedAt: null,
};

function dockValue(openContext: ChatDockValue['openContext']): ChatDockValue {
  return {
    openConversation: () => undefined,
    openContext,
    conversations: [],
    conversationsStatus: 'success',
    lastEvent: null,
    totalUnread: 0,
    refresh: () => undefined,
  };
}

function panel(openContext: ChatDockValue['openContext']) {
  return (
    <ChatDockContext.Provider value={dockValue(openContext)}>
      <ApplicationStatusPanel
        application={application}
        actionStatus="idle"
        actionError={null}
        onCancel={() => undefined}
      />
    </ChatDockContext.Provider>
  );
}

describe('ApplicationStatusPanel 채팅방으로 이동', () => {
  // 방을 만드는 요청이라 시간이 걸린다. 그동안 아무 표시가 없으면 여러 번 눌려
  // 같은 방을 만드는 요청이 겹친다.
  it('여는 중에는 다시 누를 수 없다', async () => {
    let resolveOpen: (() => void) | undefined;
    const openContext = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveOpen = () => resolve();
        }),
    );

    const user = userEvent.setup();
    renderWithProviders(panel(openContext), { authenticated: true });

    await user.click(screen.getByRole('button', { name: /채팅방으로 이동/ }));

    const opening = await screen.findByRole('button', { name: /채팅방 여는 중/ });
    expect(opening).toBeDisabled();

    await user.click(opening);
    expect(openContext).toHaveBeenCalledTimes(1);

    resolveOpen?.();
    await waitFor(() => expect(openContext).toHaveBeenCalledTimes(1));
  });

  // 실패를 삼키면 눌러도 아무 일이 없는 것처럼 보인다.
  it('열지 못하면 이유를 보여준다', async () => {
    const openContext = vi.fn(() => Promise.reject(new Error('차단된 상대입니다.')));

    const user = userEvent.setup();
    renderWithProviders(panel(openContext), { authenticated: true });

    await user.click(screen.getByRole('button', { name: /채팅방으로 이동/ }));

    expect(await screen.findByRole('alert')).toHaveTextContent('차단된 상대입니다.');
    // 실패했으면 다시 누를 수 있어야 한다.
    expect(screen.getByRole('button', { name: /채팅방으로 이동/ })).toBeEnabled();
  });
});
