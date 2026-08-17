import { cleanup, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { clearAuthSession, saveAuthSession } from '@/auth/session';
import { SpaceApplyPage } from '@/pages/space-apply/SpaceApplyPage';
import {
  applyMatching,
  cancelMatching,
  getMyMatchings,
} from '@/services/matchingService';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { MyMatching } from '@/types/api';

vi.mock('@/services/matchingService', () => ({
  applyMatching: vi.fn(),
  cancelMatching: vi.fn(),
  getMyMatchings: vi.fn(),
}));

// mockSpaces의 1번 공간은 ownerId 1, 제목 "부산대 앞 20평 상가 공실"입니다.
const FARMER = {
  userId: 2,
  email: 'farmer@example.com',
  nickname: '도시농부',
  roles: ['FARMER'] as const,
};

function renderPage(spaceId = 1) {
  return renderWithProviders(
    <Routes>
      <Route element={<SpaceApplyPage />} path="/spaces/:spaceId/apply" />
    </Routes>,
    { route: `/spaces/${spaceId}/apply` },
  );
}

function requestedApplication(overrides: Partial<MyMatching> = {}): MyMatching {
  return {
    matchingId: 21,
    spaceId: 1,
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
  saveAuthSession({ ...FARMER, roles: [...FARMER.roles] });
  vi.mocked(getMyMatchings).mockResolvedValue([]);
});

afterEach(() => {
  cleanup();
  clearAuthSession();
  vi.clearAllMocks();
});

describe('SpaceApplyPage', () => {
  it('신청 전에는 공간 요약과 작성 폼을 보여준다', async () => {
    renderPage();

    expect(
      await screen.findByRole('heading', { name: /부산대 앞 20평 상가 공실/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /공간 정보 보기/i })).toHaveAttribute(
      'href',
      '/spaces/1',
    );
    expect(screen.getByLabelText('신청 유형')).toBeInTheDocument();
    expect(screen.getByLabelText('신청 메시지')).toBeInTheDocument();
    expect(getMyMatchings).toHaveBeenCalledWith(1);
  });

  it('신청 버튼을 눌러도 확인 전에는 신청하지 않는다', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole('button', { name: '신청하기' }));

    expect(
      screen.getByRole('dialog', { name: '신청하시겠습니까?' }),
    ).toBeInTheDocument();
    expect(applyMatching).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: '닫기' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(applyMatching).not.toHaveBeenCalled();
  });

  it('확인하면 선택한 유형으로 신청하고 신청 현황으로 바뀐다', async () => {
    const user = userEvent.setup();
    vi.mocked(applyMatching).mockResolvedValue({
      matchingId: 12,
      spaceId: 1,
      farmerId: 2,
      ownerId: 1,
      type: 'HOBBY',
      message: '취미로 상추를 키우고 싶습니다.',
      status: 'REQUESTED',
      createdAt: '2026-08-04T00:00:00',
    });
    renderPage();

    await user.selectOptions(await screen.findByLabelText('신청 유형'), 'HOBBY');
    await user.clear(screen.getByLabelText('신청 메시지'));
    await user.type(
      screen.getByLabelText('신청 메시지'),
      '취미로 상추를 키우고 싶습니다.',
    );
    await user.click(screen.getByRole('button', { name: '신청하기' }));
    await user.click(screen.getByRole('button', { name: '신청' }));

    expect(applyMatching).toHaveBeenCalledWith({
      spaceId: 1,
      type: 'HOBBY',
      message: '취미로 상추를 키우고 싶습니다.',
    });
    expect(await screen.findByText('협의 중')).toBeInTheDocument();
    expect(screen.getByText('취미')).toBeInTheDocument();
    expect(screen.queryByLabelText('신청 메시지')).not.toBeInTheDocument();
    // 채팅 자리는 계약 확정을 기다리지 않고 신청 직후부터 노출된다.
    expect(screen.getByRole('button', { name: /채팅방으로 이동/i })).toBeDisabled();
  });

  it('응답을 기다리는 신청은 확인 후에만 취소한다', async () => {
    const user = userEvent.setup();
    vi.mocked(getMyMatchings).mockResolvedValue([requestedApplication()]);
    vi.mocked(cancelMatching).mockResolvedValue({
      matchingId: 21,
      status: 'CANCELED',
      respondedAt: '2026-08-05T00:00:00',
    });
    renderPage();

    await user.click(await screen.findByRole('button', { name: '신청 취소' }));

    const dialog = screen.getByRole('dialog', { name: '신청을 취소하시겠습니까?' });
    expect(cancelMatching).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole('button', { name: '신청 취소' }));

    expect(cancelMatching).toHaveBeenCalledWith(21);
    // 취소하면 다시 신청할 수 있는 상태로 돌아간다.
    expect(await screen.findByLabelText('신청 메시지')).toBeInTheDocument();
  });

  it('계약이 확정된 신청은 취소할 수 없다', async () => {
    vi.mocked(getMyMatchings).mockResolvedValue([
      requestedApplication({ status: 'ACCEPTED', respondedAt: '2026-08-05T00:00:00' }),
    ]);
    renderPage();

    expect(await screen.findByText('계약 확정')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '신청 취소' })).not.toBeInTheDocument();
  });

  it('본인 공간에는 신청 폼 대신 안내를 보여준다', async () => {
    saveAuthSession({
      userId: 1,
      email: 'owner@example.com',
      nickname: '그린스페이스랩',
      roles: ['OWNER'],
    });
    renderPage();

    expect(
      await screen.findByRole('heading', { name: '내가 등록한 공간입니다' }),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText('신청 메시지')).not.toBeInTheDocument();
  });
});
