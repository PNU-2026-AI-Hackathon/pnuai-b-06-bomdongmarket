import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { saveAuthSession } from '@/auth/session';
import { renderWithProviders } from '@/test/renderWithProviders';
import { ContractsPage } from '@/pages/dashboard/ContractsPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { MyPage } from '@/pages/dashboard/MyPage';

describe('Dashboard pages', () => {
  function signIn(roles: Array<'OWNER' | 'FARMER' | 'CONSUMER'>) {
    saveAuthSession({
      userId: 1,
      email: 'user@example.com',
      nickname: '그린스페이스랩',
      roles,
    });
  }

  it('지표, 받은 매칭 신청, 내 신청 미리보기를 렌더링한다', async () => {
    signIn(['OWNER']);
    renderWithProviders(<DashboardPage />);

    expect(screen.getByRole('heading', { level: 1, name: '대시보드' })).toBeInTheDocument();
    expect(await screen.findByText('등록 공간')).toBeInTheDocument();
    expect(screen.getByText(/받은 매칭 신청/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '내 신청' })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: '자세히 보기' })[0]).toHaveAttribute(
      'href',
      '/spaces/1/apply',
    );
    expect(screen.getByRole('link', { name: '매칭 찾기' })).toHaveAttribute(
      'href',
      '/spaces',
    );
    expect(screen.getAllByText(/도심농부 김민준/i).length).toBeGreaterThan(0);
    expect(screen.queryByText('실시간')).not.toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: '공간 등록' })).toHaveLength(1);
  });

  it('받은 매칭 신청을 수락한다', async () => {
    const user = userEvent.setup();
    signIn(['OWNER']);
    renderWithProviders(<DashboardPage />);

    await user.click((await screen.findAllByRole('button', { name: '수락' }))[0]);

    expect(await screen.findByText('수락됨')).toBeInTheDocument();
  });

  it('계약 카드를 렌더링하고 상태 탭 클릭에 반응한다', async () => {
    const user = userEvent.setup();
    signIn(['OWNER']);
    renderWithProviders(<ContractsPage />);

    expect(await screen.findByText(/장전동 상가 공실/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '완료' }));
    expect(screen.getByText(/서면 재배 공간/i)).toBeInTheDocument();
  });

  it('마이페이지 프로필 메뉴를 렌더링한다', () => {
    signIn(['OWNER']);
    renderWithProviders(<MyPage />);

    expect(screen.getByText('그린스페이스랩')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /고객센터/i })).toBeInTheDocument();
  });

  it('여러 역할을 가진 사용자는 소유자와 신청자의 대시보드 흐름을 모두 본다', async () => {
    signIn(['OWNER', 'FARMER']);
    renderWithProviders(<DashboardPage />);

    expect(await screen.findByRole('heading', { name: '내 신청' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '받은 매칭 신청' })).toBeInTheDocument();
  });

  it('소비자에게도 내 신청은 보여주되 받은 신청 관리 영역은 감춘다', async () => {
    // 신청은 역할 제한이 없으므로 CONSUMER도 보낸 신청을 확인할 수 있어야 한다.
    signIn(['CONSUMER']);
    renderWithProviders(<DashboardPage />);

    await screen.findByText('등록 공간');
    expect(screen.getByRole('heading', { name: '내 신청' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '받은 매칭 신청' })).not.toBeInTheDocument();
  });
});
