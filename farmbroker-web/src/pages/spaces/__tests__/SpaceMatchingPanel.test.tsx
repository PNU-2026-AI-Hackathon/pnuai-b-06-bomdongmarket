import { cleanup, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { clearAuthSession, saveAuthSession } from '@/auth/session';
import { mockSpaces } from '@/mocks/mockSpaces';
import { SpaceMatchingPanel } from '@/pages/spaces/components/SpaceMatchingPanel';
import { applyMatching, getMyMatchings } from '@/services/matchingService';
import { renderWithProviders } from '@/test/renderWithProviders';

vi.mock('@/services/matchingService', () => ({
  applyMatching: vi.fn(),
  getMyMatchings: vi.fn(),
}));

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

describe('SpaceMatchingPanel', () => {
  it('농부가 공간을 선택해 매칭을 신청하고 결과를 확인한다', async () => {
    const user = userEvent.setup();
    saveAuthSession(farmerSession);
    vi.mocked(getMyMatchings).mockResolvedValue([]);
    vi.mocked(applyMatching).mockResolvedValue({
      matchingId: 12,
      spaceId: 1,
      farmerId: 2,
      ownerId: 1,
      message: '상담을 요청드립니다.',
      status: 'REQUESTED',
      createdAt: '2026-08-04T00:00:00',
    });

    renderWithProviders(<SpaceMatchingPanel initialSpaceId={1} spaces={mockSpaces} />);

    expect(
      await screen.findByText(/아직 보낸 매칭 신청이 없습니다/i),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('매칭할 공간')).toHaveValue('1');
    await user.clear(screen.getByLabelText('매칭 신청 메시지'));
    await user.type(screen.getByLabelText('매칭 신청 메시지'), '상담을 요청드립니다.');
    await user.click(screen.getByRole('button', { name: '매칭 신청 보내기' }));

    await waitFor(() => {
      expect(applyMatching).toHaveBeenCalledWith({
        spaceId: 1,
        message: '상담을 요청드립니다.',
      });
    });
    expect(await screen.findByText(/신청 번호 12/i)).toBeInTheDocument();
  });

  it('결과 조회 실패 후 다시 시도할 수 있다', async () => {
    saveAuthSession(farmerSession);
    vi.mocked(getMyMatchings)
      .mockRejectedValueOnce(new Error('네트워크 오류'))
      .mockResolvedValueOnce([]);

    renderWithProviders(<SpaceMatchingPanel initialSpaceId={null} spaces={mockSpaces} />);

    expect(await screen.findByText('네트워크 오류')).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole('button', { name: '다시 시도' }));
    expect(
      await screen.findByText(/아직 보낸 매칭 신청이 없습니다/i),
    ).toBeInTheDocument();
  });

  it('비로그인 사용자는 보호된 매칭 API를 호출하지 않는다', () => {
    renderWithProviders(<SpaceMatchingPanel initialSpaceId={null} spaces={mockSpaces} />);

    expect(
      screen.getByRole('link', { name: /로그인하고 매칭 신청하기/i }),
    ).toBeInTheDocument();
    expect(getMyMatchings).not.toHaveBeenCalled();
    expect(applyMatching).not.toHaveBeenCalled();
  });

  it('신청 실패 시 입력을 보존하고 명시적으로 다시 시도한다', async () => {
    const user = userEvent.setup();
    saveAuthSession(farmerSession);
    vi.mocked(getMyMatchings).mockResolvedValue([]);
    vi.mocked(applyMatching)
      .mockRejectedValueOnce(new Error('매칭 신청을 보내지 못했습니다.'))
      .mockResolvedValueOnce({
        matchingId: 13,
        spaceId: 1,
        farmerId: 2,
        ownerId: 1,
        message: '다시 상담을 요청드립니다.',
        status: 'REQUESTED',
        createdAt: '2026-08-04T00:00:00',
      });

    renderWithProviders(<SpaceMatchingPanel initialSpaceId={1} spaces={mockSpaces} />);

    await screen.findByText(/아직 보낸 매칭 신청이 없습니다/i);
    await user.clear(screen.getByLabelText('매칭 신청 메시지'));
    await user.type(
      screen.getByLabelText('매칭 신청 메시지'),
      '다시 상담을 요청드립니다.',
    );
    await user.click(screen.getByRole('button', { name: '매칭 신청 보내기' }));

    expect(await screen.findByText('매칭 신청을 보내지 못했습니다.')).toBeInTheDocument();
    expect(screen.getByLabelText('매칭 신청 메시지')).toHaveValue(
      '다시 상담을 요청드립니다.',
    );
    await user.click(screen.getByRole('button', { name: '매칭 신청 다시 시도' }));
    expect(await screen.findByText(/신청 번호 13/i)).toBeInTheDocument();
    expect(applyMatching).toHaveBeenCalledTimes(2);
  });

  it('비농부 사용자는 보호된 매칭 API를 호출하지 않는다', () => {
    saveAuthSession({
      accessToken: 'owner-token',
      user: {
        userId: 1,
        email: 'owner@example.com',
        nickname: '공간제공자',
        role: 'OWNER',
      },
    });

    renderWithProviders(<SpaceMatchingPanel initialSpaceId={null} spaces={mockSpaces} />);

    expect(
      screen.getByText(/도심 농부 계정에서 사용할 수 있습니다/i),
    ).toBeInTheDocument();
    expect(getMyMatchings).not.toHaveBeenCalled();
    expect(applyMatching).not.toHaveBeenCalled();
  });

  it('내 매칭 신청 결과의 공간과 상태를 표시한다', async () => {
    saveAuthSession(farmerSession);
    vi.mocked(getMyMatchings).mockResolvedValue([
      {
        matchingId: 22,
        spaceId: 1,
        spaceTitle: '부산대 앞 20평 상가 공실',
        spaceImageUrl: null,
        monthlyRent: 500000,
        ownerNickname: '그린스페이스랩',
        status: 'REQUESTED',
        createdAt: '2026-08-04T00:00:00',
        respondedAt: null,
      },
    ]);

    renderWithProviders(<SpaceMatchingPanel initialSpaceId={null} spaces={mockSpaces} />);

    expect(await screen.findByText('부산대 앞 20평 상가 공실')).toBeInTheDocument();
    expect(screen.getByText('신청 대기')).toBeInTheDocument();
  });

  it('신청 중에는 중복 요청을 막는다', async () => {
    const user = userEvent.setup();
    let resolveRequest:
      ((value: Awaited<ReturnType<typeof applyMatching>>) => void) | undefined;
    saveAuthSession(farmerSession);
    vi.mocked(getMyMatchings).mockResolvedValue([]);
    vi.mocked(applyMatching).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRequest = resolve;
        }),
    );

    renderWithProviders(<SpaceMatchingPanel initialSpaceId={1} spaces={mockSpaces} />);

    await screen.findByText(/아직 보낸 매칭 신청이 없습니다/i);
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
    expect(await screen.findByText(/신청 번호 14/i)).toBeInTheDocument();
  });

  it('초기 결과 조회 중 신청해도 완료 후 최신 결과를 다시 불러온다', async () => {
    const user = userEvent.setup();
    let resolveInitialRequests:
      ((value: Awaited<ReturnType<typeof getMyMatchings>>) => void) | undefined;
    saveAuthSession(farmerSession);
    vi.mocked(getMyMatchings)
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveInitialRequests = resolve;
          }),
      )
      .mockResolvedValueOnce([
        {
          matchingId: 25,
          spaceId: 1,
          spaceTitle: '부산대 앞 20평 상가 공실',
          spaceImageUrl: null,
          monthlyRent: 500000,
          ownerNickname: '그린스페이스랩',
          status: 'REQUESTED',
          createdAt: '2026-08-04T00:00:00',
          respondedAt: null,
        },
      ]);
    vi.mocked(applyMatching).mockResolvedValue({
      matchingId: 25,
      spaceId: 1,
      farmerId: 2,
      ownerId: 1,
      message: '상담을 요청드립니다.',
      status: 'REQUESTED',
      createdAt: '2026-08-04T00:00:00',
    });

    renderWithProviders(<SpaceMatchingPanel initialSpaceId={1} spaces={mockSpaces} />);

    const submitButton = screen.getByRole('button', { name: '매칭 신청 보내기' });
    await waitFor(() => expect(submitButton).toBeEnabled());
    await user.click(submitButton);

    await waitFor(() => expect(getMyMatchings).toHaveBeenCalledTimes(2));
    expect(await screen.findByText('부산대 앞 20평 상가 공실')).toBeInTheDocument();
    resolveInitialRequests?.([]);
    await waitFor(() => {
      expect(screen.getByText('부산대 앞 20평 상가 공실')).toBeInTheDocument();
    });
  });
});
