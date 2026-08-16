import { cleanup, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { clearAuthSession, saveAuthSession } from '@/auth/session';
import { SpaceMatchingRequestCard } from '@/pages/space-detail/components/SpaceMatchingRequestCard';
import { cancelMatching, getMyMatchings } from '@/services/matchingService';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { MyMatching, UserRole } from '@/types/api';

vi.mock('@/services/matchingService', () => ({
  cancelMatching: vi.fn(),
  getMyMatchings: vi.fn(),
}));

const consumerSession = {
  userId: 2,
  email: 'farmer@example.com',
  nickname: '도시농부',
  roles: ['CONSUMER'] as UserRole[],
};

function application(overrides: Partial<MyMatching> = {}): MyMatching {
  return {
    matchingId: 21,
    spaceId: 7,
    spaceTitle: '부산대 앞 20평 상가 공실',
    spaceImageUrl: null,
    monthlyRent: 500000,
    ownerNickname: '그린스페이스랩',
    type: 'PROFIT',
    message: '상추와 허브를 재배하려고 합니다.',
    status: 'REQUESTED',
    createdAt: '2026-08-04T00:00:00',
    respondedAt: null,
    ...overrides,
  };
}

beforeEach(() => {
  vi.mocked(getMyMatchings).mockResolvedValue([]);
});

afterEach(() => {
  cleanup();
  clearAuthSession();
  vi.clearAllMocks();
});

describe('SpaceMatchingRequestCard', () => {
  it('비로그인 사용자는 로그인으로 안내한다', () => {
    renderWithProviders(<SpaceMatchingRequestCard spaceId={1} />);

    expect(
      screen.getByRole('link', { name: /로그인하고 매칭 신청하기/i }),
    ).toHaveAttribute('href', '/login');
    expect(getMyMatchings).not.toHaveBeenCalled();
  });

  it('신청하지 않은 공간이면 해당 공간의 신청 화면으로 이동한다', async () => {
    saveAuthSession(consumerSession);

    renderWithProviders(<SpaceMatchingRequestCard spaceId={7} />);

    expect(await screen.findByRole('link', { name: /매칭 신청하기/i })).toHaveAttribute(
      'href',
      '/spaces/7/apply',
    );
    expect(getMyMatchings).toHaveBeenCalledWith(7);
  });

  it('응답을 기다리는 신청이 있으면 신청 대신 채팅·계약서·신청 취소를 보여준다', async () => {
    saveAuthSession(consumerSession);
    vi.mocked(getMyMatchings).mockResolvedValue([application()]);

    renderWithProviders(<SpaceMatchingRequestCard spaceId={7} />);

    expect(await screen.findByRole('button', { name: '채팅' })).toBeInTheDocument();
    // 계약서는 이동이라 link입니다 — 해당 매칭의 계약서 화면으로 연결됩니다.
    expect(screen.getByRole('link', { name: '계약서' })).toHaveAttribute(
      'href',
      '/matchings/21/contract',
    );
    expect(screen.getByRole('button', { name: '신청 취소' })).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: /매칭 신청하기/i }),
    ).not.toBeInTheDocument();
  });

  it('수락된 신청은 취소할 수 없다', async () => {
    saveAuthSession(consumerSession);
    vi.mocked(getMyMatchings).mockResolvedValue([application({ status: 'ACCEPTED' })]);

    renderWithProviders(<SpaceMatchingRequestCard spaceId={7} />);

    expect(await screen.findByRole('button', { name: '채팅' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '신청 취소' })).not.toBeInTheDocument();
  });

  it('확인 후 신청을 취소하면 다시 신청할 수 있는 상태로 돌아간다', async () => {
    const user = userEvent.setup();
    saveAuthSession(consumerSession);
    vi.mocked(getMyMatchings).mockResolvedValue([application()]);
    vi.mocked(cancelMatching).mockResolvedValue({
      matchingId: 21,
      status: 'CANCELED',
      respondedAt: '2026-08-05T00:00:00',
    });

    renderWithProviders(<SpaceMatchingRequestCard spaceId={7} />);

    await user.click(await screen.findByRole('button', { name: '신청 취소' }));
    const dialog = screen.getByRole('dialog', { name: '신청을 취소하시겠습니까?' });
    await user.click(within(dialog).getByRole('button', { name: '신청 취소' }));

    expect(cancelMatching).toHaveBeenCalledWith(21);
    expect(
      await screen.findByRole('link', { name: /매칭 신청하기/i }),
    ).toBeInTheDocument();
  });
});
