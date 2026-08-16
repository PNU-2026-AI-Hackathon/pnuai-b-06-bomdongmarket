import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

import { ChatListPage } from '@/pages/chat/ChatListPage';
import { renderWithProviders } from '@/test/renderWithProviders';

// 목업 채팅 목록에는 마켓 문의 1건과 공간 문의 1건이 들어 있다.
describe('ChatListPage', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it('공간 문의와 마켓 문의를 함께 보여준다', async () => {
    renderWithProviders(<ChatListPage />, { authenticated: true, route: '/chat' });

    expect(await screen.findByText('버터헤드 상추')).toBeInTheDocument();
    expect(screen.getByText('부산대 앞 20평 상가 공실')).toBeInTheDocument();
  });

  // 두 종류가 섞이면 무엇에 대한 대화인지 헷갈려 탭으로 나눈다.
  it('마켓 탭을 고르면 공간 문의는 빠진다', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ChatListPage />, { authenticated: true, route: '/chat' });

    await screen.findByText('버터헤드 상추');
    await user.click(screen.getByRole('tab', { name: /마켓/ }));

    expect(screen.getByText('버터헤드 상추')).toBeInTheDocument();
    expect(screen.queryByText('부산대 앞 20평 상가 공실')).not.toBeInTheDocument();
  });

  it('공간 탭을 고르면 마켓 문의는 빠진다', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ChatListPage />, { authenticated: true, route: '/chat' });

    await screen.findByText('부산대 앞 20평 상가 공실');
    await user.click(screen.getByRole('tab', { name: /공간/ }));

    expect(screen.getByText('부산대 앞 20평 상가 공실')).toBeInTheDocument();
    expect(screen.queryByText('버터헤드 상추')).not.toBeInTheDocument();
  });

  it('안 읽은 메시지 수를 표시한다', async () => {
    renderWithProviders(<ChatListPage />, { authenticated: true, route: '/chat' });

    expect(await screen.findByLabelText('안 읽은 메시지 1개')).toBeInTheDocument();
  });
});
