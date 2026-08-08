import { cleanup, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useLocation } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { clearAuthSession, saveAuthSession } from '@/auth/session';
import { applyMatching } from '@/services/matchingService';
import { getRecommendation } from '@/services/spaceService';
import { renderWithProviders } from '@/test/renderWithProviders';
import { SpaceDetailPage } from '@/pages/space-detail/SpaceDetailPage';

vi.mock('@/services/matchingService', () => ({ applyMatching: vi.fn() }));
vi.mock('@/services/spaceService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/spaceService')>()),
  getRecommendation: vi.fn(),
}));

function LocationProbe() {
  return <output>{useLocation().pathname}</output>;
}

afterEach(() => {
  cleanup();
  clearAuthSession();
  vi.clearAllMocks();
});

describe('SpaceDetailPage', () => {
  it('비로그인 사용자가 AI 추천을 실행하면 로그인으로 이동하고 API를 호출하지 않는다', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <SpaceDetailPage />
        <LocationProbe />
      </>,
      { route: '/spaces/1' },
    );

    expect(
      await screen.findByRole('heading', {
        name: /부산대 앞 20평 상가 공실/i,
      }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /AI 추천 실행/i }));
    expect(screen.getByText('/login')).toBeInTheDocument();
    expect(getRecommendation).not.toHaveBeenCalled();
  });

  it('로그인한 사용자는 AI 추천 API를 실행할 수 있다', async () => {
    const user = userEvent.setup();
    saveAuthSession({
      userId: 3,
      email: 'consumer@example.com',
      nickname: '지역소비자',
      roles: ['CONSUMER'],
    });
    vi.mocked(getRecommendation).mockResolvedValue({
      recommendationId: 1,
      spaceId: 1,
      recommendedCrops: [
        {
          cropId: 1,
          cropName: '버터헤드 상추',
          reason: '공간 조건에 적합합니다.',
          expectedYieldKg: 10,
          avgPricePerKg: 1000,
        },
      ],
      layoutSuggestion: '창가 쪽에 재배 선반을 배치하세요.',
      cautions: [],
      createdAt: '2026-08-05T00:00:00',
      // 이 화면은 서버 계산 수익(profitEstimate)을 아직 쓰지 않지만 응답 타입에는 포함된다.
      profitEstimate: null,
    });
    renderWithProviders(<SpaceDetailPage />, { route: '/spaces/1' });

    await user.click(await screen.findByRole('button', { name: /AI 추천 실행/i }));

    expect(getRecommendation).toHaveBeenCalledWith(1);
    expect(await screen.findByText('배치 제안')).toBeInTheDocument();
  });

  it('농부가 상세 화면에서 매칭을 신청한다', async () => {
    const user = userEvent.setup();
    saveAuthSession({
      userId: 2,
      email: 'farmer@example.com',
      nickname: '도시농부',
      roles: ['FARMER'],
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
