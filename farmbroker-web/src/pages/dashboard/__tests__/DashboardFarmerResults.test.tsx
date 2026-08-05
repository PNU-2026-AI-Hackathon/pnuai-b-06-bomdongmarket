import { cleanup, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { clearAuthSession, saveAuthSession } from '@/auth/session';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { getDashboardData, type DashboardData } from '@/services/dashboardService';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { UserRole } from '@/types/api';

vi.mock('@/services/dashboardService', () => ({ getDashboardData: vi.fn() }));

const farmerSession = {
  accessToken: 'farmer-token',
  user: {
    userId: 2,
    email: 'farmer@example.com',
    nickname: '도시농부',
    roles: ['FARMER'] as UserRole[],
  },
};

const emptyDashboard: DashboardData = {
  metrics: [],
  matchings: [],
  sentMatchings: [],
  contracts: [],
};

afterEach(() => {
  cleanup();
  clearAuthSession();
  vi.clearAllMocks();
});

describe('Dashboard farmer matching results', () => {
  it('농부가 보낸 매칭 신청 결과를 표시한다', async () => {
    saveAuthSession(farmerSession);
    vi.mocked(getDashboardData).mockResolvedValue({
      ...emptyDashboard,
      sentMatchings: [
        {
          matchingId: 20,
          spaceId: 1,
          spaceTitle: '부산대 앞 20평 상가 공실',
          spaceImageUrl: null,
          monthlyRent: 500000,
          ownerNickname: '그린스페이스랩',
          status: 'ACCEPTED',
          createdAt: '2026-08-04T00:00:00',
          respondedAt: '2026-08-04T01:00:00',
        },
      ],
    });

    renderWithProviders(<DashboardPage />);

    expect(
      await screen.findByRole('heading', { name: '농장 매칭 신청' }),
    ).toBeInTheDocument();
    expect(screen.getByText('부산대 앞 20평 상가 공실')).toBeInTheDocument();
    expect(screen.getByText('수락됨')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: '부산대 앞 20평 상가 공실 상세 보기' }),
    ).toHaveAttribute('href', '/spaces/1');
  });

  it('결과 로드 실패 후 다시 시도해 빈 상태를 안내한다', async () => {
    const user = userEvent.setup();
    saveAuthSession(farmerSession);
    vi.mocked(getDashboardData)
      .mockRejectedValueOnce(new Error('네트워크 오류'))
      .mockResolvedValueOnce(emptyDashboard);

    renderWithProviders(<DashboardPage />);

    expect(await screen.findByText('네트워크 오류')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '다시 시도' }));
    expect(await screen.findByText('보낸 매칭 신청이 없습니다')).toBeInTheDocument();
  });
});
