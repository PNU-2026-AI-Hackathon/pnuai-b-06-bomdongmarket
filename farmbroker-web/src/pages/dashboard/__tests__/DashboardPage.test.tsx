import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { renderWithProviders } from '@/test/renderWithProviders';
import { ContractsPage } from '@/pages/dashboard/ContractsPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { MyPage } from '@/pages/dashboard/MyPage';

describe('Dashboard pages', () => {
  it('지표, 매칭 신청, 계약 미리보기를 렌더링한다', async () => {
    renderWithProviders(<DashboardPage />);

    expect(await screen.findByText('등록 공간')).toBeInTheDocument();
    expect(screen.getByText(/받은 매칭 신청/i)).toBeInTheDocument();
    expect(screen.getAllByText(/도심농부 김민준/i).length).toBeGreaterThan(0);
  });

  it('받은 매칭 신청을 수락한다', async () => {
    const user = userEvent.setup();
    renderWithProviders(<DashboardPage />);

    await user.click((await screen.findAllByRole('button', { name: '수락' }))[0]);

    expect(await screen.findByText('수락됨')).toBeInTheDocument();
  });

  it('계약 카드를 렌더링하고 상태 탭 클릭에 반응한다', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ContractsPage />);

    expect(await screen.findByText(/장전동 상가 공실/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '완료' }));
    expect(screen.getByText(/서면 재배 공간/i)).toBeInTheDocument();
  });

  it('마이페이지 프로필 메뉴를 렌더링한다', () => {
    renderWithProviders(<MyPage />);

    expect(screen.getByText('그린스페이스랩')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /고객센터/i })).toBeInTheDocument();
  });
});
