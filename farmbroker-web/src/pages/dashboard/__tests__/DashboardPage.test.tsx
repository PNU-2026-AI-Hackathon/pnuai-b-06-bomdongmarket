import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { saveAuthSession } from '@/auth/session';
import { renderWithProviders } from '@/test/renderWithProviders';
import { ContractsPage } from '@/pages/dashboard/ContractsPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';

describe('Dashboard pages', () => {
  function signIn(roles: Array<'OWNER' | 'FARMER' | 'CONSUMER'>) {
    saveAuthSession({
      userId: 1,
      email: 'user@example.com',
      nickname: '그린스페이스랩',
      roles,
    });
  }

  it('지표, 매칭 신청, 계약 미리보기를 렌더링한다', async () => {
    signIn(['OWNER']);
    renderWithProviders(<DashboardPage />);

    expect(screen.getByRole('heading', { level: 1, name: '대시보드' })).toBeInTheDocument();
    expect(await screen.findByText('등록 공간')).toBeInTheDocument();
    expect(screen.getByText(/받은 매칭 신청/i)).toBeInTheDocument();
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

  it('여러 역할을 가진 사용자는 소유자와 농부의 대시보드 흐름을 모두 본다', async () => {
    signIn(['OWNER', 'FARMER']);
    renderWithProviders(<DashboardPage />);

    expect(await screen.findByRole('heading', { name: '농장 매칭 신청' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '받은 매칭 신청' })).toBeInTheDocument();
  });

  it('소비자에게는 소유자와 농부의 매칭 관리 영역을 노출하지 않는다', async () => {
    signIn(['CONSUMER']);
    renderWithProviders(<DashboardPage />);

    await screen.findByText('등록 공간');
    expect(screen.queryByRole('heading', { name: '받은 매칭 신청' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '농장 매칭 신청' })).not.toBeInTheDocument();
  });
});
