import { cleanup, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { clearAuthSession, saveAuthSession } from '@/auth/session';
import { applyMatching } from '@/services/matchingService';
import { renderWithProviders } from '@/test/renderWithProviders';
import { SpaceDetailPage } from '@/pages/space-detail/SpaceDetailPage';

vi.mock('@/services/matchingService', () => ({ applyMatching: vi.fn() }));

afterEach(() => {
  cleanup();
  clearAuthSession();
  vi.clearAllMocks();
});

describe('SpaceDetailPage', () => {
  it('상세 데이터를 불러오고 AI 추천을 실행한다', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SpaceDetailPage />, { route: '/spaces/1' });

    expect(
      await screen.findByRole('heading', {
        name: /부산대 앞 20평 상가 공실/i,
      }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /AI 추천 실행/i }));
    expect(await screen.findByText(/배치 제안/i)).toBeInTheDocument();
    expect(screen.getAllByText(/버터헤드 상추/i).length).toBeGreaterThan(0);
  });

  it('농부가 상세 화면에서 매칭을 신청한다', async () => {
    const user = userEvent.setup();
    saveAuthSession({
      accessToken: 'farmer-token',
      user: {
        userId: 2,
        email: 'farmer@example.com',
        nickname: '도시농부',
        role: 'FARMER',
      },
    });
    vi.mocked(applyMatching).mockResolvedValue({
      matchingId: 12,
      spaceId: 1,
      farmerId: 2,
      ownerId: 1,
      message: '상담을 요청드립니다.',
      status: 'REQUESTED',
      createdAt: '2026-08-04T00:00:00',
    });
    renderWithProviders(<SpaceDetailPage />, { route: '/spaces/1' });

    await screen.findByRole('heading', { name: /부산대 앞 20평 상가 공실/i });
    await user.clear(screen.getByLabelText('매칭 신청 메시지'));
    await user.type(screen.getByLabelText('매칭 신청 메시지'), '상담을 요청드립니다.');
    await user.click(screen.getByRole('button', { name: '매칭 신청 보내기' }));

    expect(applyMatching).toHaveBeenCalledWith({
      spaceId: 1,
      message: '상담을 요청드립니다.',
    });
    expect(await screen.findByText(/신청 번호 12/i)).toBeInTheDocument();
  });
});
