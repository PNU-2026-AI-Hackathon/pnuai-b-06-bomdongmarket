import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { Route, Routes, useLocation } from 'react-router-dom';

import { ChatDockProvider } from '@/chat/ChatDockProvider';
import { useChatDock } from '@/chat/chatDockContext';
import { renderWithProviders } from '@/test/renderWithProviders';

// 화면 폭은 matchMedia 로만 판단한다(jsdom 에는 레이아웃이 없다).
function setNarrow(narrow: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: narrow,
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    }),
  });
}

function OpenButton() {
  const chatDock = useChatDock();
  return (
    <button onClick={() => chatDock.openConversation(7)} type="button">
      대화 열기
    </button>
  );
}

function LocationLabel() {
  return <span>현재 경로: {useLocation().pathname}</span>;
}

function renderDock() {
  renderWithProviders(
    <ChatDockProvider>
      <OpenButton />
      <Routes>
        <Route element={<LocationLabel />} path="*" />
      </Routes>
    </ChatDockProvider>,
    { authenticated: true, route: '/market/1' },
  );
}

describe('ChatDockProvider 대화 열기', () => {
  afterEach(() => {
    setNarrow(false);
  });

  // 도크는 lg 이상에서만 뜨므로, 좁은 화면에서 방만 열면 아무것도 안 보인다.
  it('좁은 화면에서는 채팅방 화면으로 이동한다', async () => {
    setNarrow(true);
    const user = userEvent.setup();
    renderDock();

    await user.click(screen.getByRole('button', { name: '대화 열기' }));

    expect(screen.getByText('현재 경로: /chat/7')).toBeInTheDocument();
  });

  it('넓은 화면에서는 이동하지 않고 위젯으로 연다', async () => {
    setNarrow(false);
    const user = userEvent.setup();
    renderDock();

    await user.click(screen.getByRole('button', { name: '대화 열기' }));

    expect(screen.getByText('현재 경로: /market/1')).toBeInTheDocument();
    expect(await screen.findByLabelText('채팅 최소화')).toBeInTheDocument();
  });
});
