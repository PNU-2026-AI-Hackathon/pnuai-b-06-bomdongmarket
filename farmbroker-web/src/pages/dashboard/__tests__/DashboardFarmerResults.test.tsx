import { cleanup, screen, within } from '@testing-library/react';
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
  ownedSpaces: [],
  contractedSpaces: [],
  receivedApplications: [],
  sentApplications: [],
  wishlistItems: [],
};

afterEach(() => {
  cleanup();
  clearAuthSession();
  vi.clearAllMocks();
});

describe('Dashboard 신청 알림', () => {
  it('보낸 신청을 상태와 함께 표시하고 신청 화면으로 연결한다', async () => {
    const user = userEvent.setup();
    saveAuthSession(farmerSession);
    vi.mocked(getDashboardData).mockResolvedValue({
      ...emptyDashboard,
      sentApplications: [
        {
          contractId: 20,
          spaceId: 1,
          spaceName: '부산대 앞 20평 상가 공실',
          counterparty: '그린스페이스랩',
          status: 'ACCEPTED',
          monthlyRent: 500000,
          type: 'PROFIT',
          imageUrl: null,
        },
      ],
    });

    renderWithProviders(<DashboardPage />);
    await user.click(await screen.findByRole('button', { name: '알림' }));

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('부산대 앞 20평 상가 공실')).toBeInTheDocument();
    expect(within(dialog).getByText('수익')).toBeInTheDocument();
    expect(within(dialog).getByRole('link', { name: '자세히 보기' })).toHaveAttribute(
      'href',
      '/spaces/1/apply',
    );
  });

  it('보낸 신청 상태를 협의 중과 계약 확정으로 표시한다', async () => {
    const user = userEvent.setup();
    saveAuthSession(farmerSession);
    vi.mocked(getDashboardData).mockResolvedValue({
      ...emptyDashboard,
      sentApplications: (['REQUESTED', 'ACCEPTED'] as const).map((status, index) => ({
        contractId: index,
        spaceId: index + 1,
        spaceName: '공간 ' + index,
        counterparty: '공간 제공자',
        status,
        monthlyRent: 100000,
        type: 'PROFIT' as const,
        imageUrl: null,
      })),
    });

    renderWithProviders(<DashboardPage />);
    await user.click(await screen.findByRole('button', { name: '알림, 응답 대기 1건' }));

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('협의 중')).toBeInTheDocument();
    expect(within(dialog).getByText('계약 확정')).toBeInTheDocument();
    expect(within(dialog).queryByText('검토')).not.toBeInTheDocument();
    expect(within(dialog).queryByText('완료')).not.toBeInTheDocument();
  });

  it('결과 로드 실패 후 다시 시도해 세 섹션의 빈 상태를 안내한다', async () => {
    const user = userEvent.setup();
    saveAuthSession(farmerSession);
    vi.mocked(getDashboardData)
      .mockRejectedValueOnce(new Error('네트워크 오류'))
      .mockResolvedValueOnce(emptyDashboard);

    renderWithProviders(<DashboardPage />);

    expect(await screen.findByText('네트워크 오류')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '다시 시도' }));
    expect(await screen.findByText('등록한 공간이 없습니다')).toBeInTheDocument();
    expect(screen.getByText('계약한 공간이 없습니다')).toBeInTheDocument();
    expect(screen.getByText('찜한 상품이 없습니다')).toBeInTheDocument();
  });
});
