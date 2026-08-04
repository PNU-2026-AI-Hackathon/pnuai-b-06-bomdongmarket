import { cleanup, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { clearAuthSession, saveAuthSession } from '@/auth/session';
import { SpaceMatchingRequestCard } from '@/pages/space-detail/components/SpaceMatchingRequestCard';
import { applyMatching } from '@/services/matchingService';
import { renderWithProviders } from '@/test/renderWithProviders';

vi.mock('@/services/matchingService', () => ({ applyMatching: vi.fn() }));

const farmerSession = {
  accessToken: 'farmer-token',
  user: {
    userId: 2,
    email: 'farmer@example.com',
    nickname: '도시농부',
    role: 'FARMER' as const,
  },
};

afterEach(() => {
  cleanup();
  clearAuthSession();
  vi.clearAllMocks();
});

describe('SpaceMatchingRequestCard', () => {
  it('비로그인 사용자는 신청 API를 호출하지 않는다', () => {
    renderWithProviders(<SpaceMatchingRequestCard spaceId={1} />);

    expect(
      screen.getByRole('link', { name: /로그인하고 매칭 신청하기/i }),
    ).toBeInTheDocument();
    expect(applyMatching).not.toHaveBeenCalled();
  });

  it('실패한 신청의 메시지를 보존하고 다시 시도한다', async () => {
    const user = userEvent.setup();
    saveAuthSession(farmerSession);
    vi.mocked(applyMatching)
      .mockRejectedValueOnce(new Error('네트워크 오류'))
      .mockResolvedValueOnce({
        matchingId: 13,
        spaceId: 1,
        farmerId: 2,
        ownerId: 1,
        message: '다시 상담을 요청드립니다.',
        status: 'REQUESTED',
        createdAt: '2026-08-04T00:00:00',
      });

    renderWithProviders(<SpaceMatchingRequestCard spaceId={1} />);

    await user.clear(screen.getByLabelText('매칭 신청 메시지'));
    await user.type(
      screen.getByLabelText('매칭 신청 메시지'),
      '다시 상담을 요청드립니다.',
    );
    await user.click(screen.getByRole('button', { name: '매칭 신청 보내기' }));
    expect(await screen.findByText('네트워크 오류')).toBeInTheDocument();
    expect(screen.getByLabelText('매칭 신청 메시지')).toHaveValue(
      '다시 상담을 요청드립니다.',
    );
    await user.click(screen.getByRole('button', { name: '매칭 신청 다시 시도' }));
    expect(await screen.findByText(/신청 번호 13/i)).toBeInTheDocument();
  });

  it('신청 중에는 중복 요청을 막는다', async () => {
    const user = userEvent.setup();
    let resolveRequest:
      ((value: Awaited<ReturnType<typeof applyMatching>>) => void) | undefined;
    saveAuthSession(farmerSession);
    vi.mocked(applyMatching).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRequest = resolve;
        }),
    );

    renderWithProviders(<SpaceMatchingRequestCard spaceId={1} />);

    const submitButton = screen.getByRole('button', { name: '매칭 신청 보내기' });
    await user.click(submitButton);
    expect(await screen.findByRole('button', { name: '매칭 신청 중...' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: '매칭 신청 중...' }));
    expect(applyMatching).toHaveBeenCalledTimes(1);

    resolveRequest?.({
      matchingId: 14,
      spaceId: 1,
      farmerId: 2,
      ownerId: 1,
      message: '상담을 요청드립니다.',
      status: 'REQUESTED',
      createdAt: '2026-08-04T00:00:00',
    });
    await waitFor(() => expect(screen.getByText(/신청 번호 14/i)).toBeInTheDocument());
  });
});
