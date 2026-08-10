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
  userId: 2,
  email: 'farmer@example.com',
  nickname: '도시농부',
  roles: ['FARMER'] as UserRole[],
};

const emptyDashboard: DashboardData = {
  metrics: [],
  matchings: [],
  contracts: [],
};

afterEach(() => {
  cleanup();
  clearAuthSession();
  vi.clearAllMocks();
});

describe('Dashboard 내 신청 섹션', () => {
  it('보낸 신청을 유형과 함께 표시하고 신청 화면으로 연결한다', async () => {
    saveAuthSession(farmerSession);
    vi.mocked(getDashboardData).mockResolvedValue({
      ...emptyDashboard,
      contracts: [
        {
          contractId: 20,
          spaceId: 1,
          spaceName: '부산대 앞 20평 상가 공실',
          counterparty: '그린스페이스랩',
          status: '완료',
          monthlyRent: 500000,
          type: 'PROFIT',
        },
      ],
    });

    renderWithProviders(<DashboardPage />);

    expect(await screen.findByRole('heading', { name: '내 신청' })).toBeInTheDocument();
    expect(screen.getByText('부산대 앞 20평 상가 공실')).toBeInTheDocument();
    expect(screen.getByText('수익')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '자세히 보기' })).toHaveAttribute(
      'href',
      '/spaces/1/apply',
    );
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
