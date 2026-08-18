import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

import { clearAuthSession, saveAuthSession } from '@/auth/session';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { renderWithProviders } from '@/test/renderWithProviders';

describe('Dashboard pages', () => {
  function signIn(roles: Array<'OWNER' | 'FARMER' | 'CONSUMER'>) {
    saveAuthSession({
      userId: 1,
      email: 'user@example.com',
      nickname: '그린스페이스랩',
      roles,
    });
  }

  beforeEach(() => {
    clearAuthSession();
    window.sessionStorage.clear();
  });

  it('등록 공간, 계약 공간, 찜한 상품을 슬라이드로 렌더링한다', async () => {
    signIn(['OWNER']);
    // 찜 목업은 상품 id 배열만 저장한다 — 찜에는 수량이 없다.
    window.sessionStorage.setItem('farmbroker.mock.wishlist', JSON.stringify([1]));
    renderWithProviders(<DashboardPage />);

    expect(
      screen.getByRole('heading', { level: 1, name: '대시보드' }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('heading', { level: 2, name: '내가 등록한 공간' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: '계약한 공간' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: '찜한 상품' }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole('link', { name: '부산대 앞 20평 상가 공실 공간 상세 보기' })[0],
    ).toHaveAttribute('href', '/spaces/1');
    expect(
      screen.getByRole('link', { name: '버터헤드 상추 상품 상세 보기' }),
    ).toHaveAttribute('href', '/market/1');
    expect(screen.queryByText('빠른 실행')).not.toBeInTheDocument();
    expect(screen.queryByText('전체보기')).not.toBeInTheDocument();
    expect(screen.queryByText('도심농부 김민준')).not.toBeInTheDocument();
  });

  it('알림 모달의 받은 신청은 수락·거절 대신 채팅·계약서로 이어지고, 닫으면 알림 버튼으로 포커스를 돌려준다', async () => {
    const user = userEvent.setup();
    signIn(['OWNER']);
    renderWithProviders(<DashboardPage />);

    const notificationButton = await screen.findByRole('button', {
      name: '알림, 응답 대기 2건',
    });
    await user.click(notificationButton);

    const dialog = screen.getByRole('dialog', { name: '받은 신청과 보낸 신청' });
    expect(
      within(dialog).getByRole('heading', { name: '받은 신청' }),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole('heading', { name: '보낸 신청' }),
    ).toBeInTheDocument();
    expect(within(dialog).getByText(/도심농부 김민준/)).toBeInTheDocument();

    // 소유자가 신청을 일방적으로 처리하는 버튼은 더 이상 없다.
    expect(within(dialog).queryByRole('button', { name: '수락' })).not.toBeInTheDocument();
    expect(within(dialog).queryByRole('button', { name: '거절' })).not.toBeInTheDocument();
    expect(within(dialog).getAllByRole('button', { name: '채팅' })[0]).toBeInTheDocument();
    expect(within(dialog).getAllByRole('link', { name: '계약서' })[0]).toHaveAttribute(
      'href',
      '/matchings/1/contract',
    );

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '알림, 응답 대기 2건' })).toHaveFocus();
  });

  it('여러 역할을 가진 사용자는 받은 신청과 보낸 신청을 한 모달에서 본다', async () => {
    const user = userEvent.setup();
    signIn(['OWNER', 'FARMER']);
    renderWithProviders(<DashboardPage />);

    await screen.findByRole('heading', { name: '내가 등록한 공간' });
    await user.click(screen.getByRole('button', { name: /알림/ }));
    const dialog = screen.getByRole('dialog');
    expect(
      within(dialog).getByRole('heading', { name: '받은 신청' }),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole('heading', { name: '보낸 신청' }),
    ).toBeInTheDocument();
  });

  it('소비자 알림에는 보낸 신청만 표시한다', async () => {
    const user = userEvent.setup();
    signIn(['CONSUMER']);
    renderWithProviders(<DashboardPage />);

    await user.click(await screen.findByRole('button', { name: '알림, 응답 대기 1건' }));
    const dialog = screen.getByRole('dialog');
    expect(
      within(dialog).getByRole('heading', { name: '보낸 신청' }),
    ).toBeInTheDocument();
    expect(
      within(dialog).queryByRole('heading', { name: '받은 신청' }),
    ).not.toBeInTheDocument();
  });
});
