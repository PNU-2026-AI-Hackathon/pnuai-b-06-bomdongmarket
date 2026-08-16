import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { renderWithProviders } from '@/test/renderWithProviders';
import { SpaceList } from '@/pages/spaces/components/SpaceList';
import { SpacesPage } from '@/pages/spaces/SpacesPage';

// 지도 검색 통합 테스트용 — 반경 검색은 mock 공간의 실제 지오코딩 없이 좌표를 직접 제어해야 한다.
const FAR_QUERY = '강원도 정선군 두메산골';
const NEAR_COORDS = { lat: 35.1798, lng: 129.075 };
const FAR_COORDS = { lat: 37.5, lng: 128.9 };

vi.mock('@/utils/geocode', async () => {
  const actual = await vi.importActual<typeof import('@/utils/geocode')>('@/utils/geocode');
  return {
    ...actual,
    geocodeAddress: (address: string) =>
      Promise.resolve(address === FAR_QUERY ? FAR_COORDS : NEAR_COORDS),
  };
});

vi.mock('@/utils/kakaoSdk', async () => {
  const actual = await vi.importActual<typeof import('@/utils/kakaoSdk')>('@/utils/kakaoSdk');
  return { ...actual, hasKakaoMapKey: () => true };
});

describe('SpacesPage', () => {
  it('mock 서비스의 등록 공간을 렌더링한다', async () => {
    renderWithProviders(<SpacesPage />);

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: /스마트팜으로 전환 가능한 도심 공간 찾기/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('search', { name: /공간 검색 및 정렬/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/등록된 공간을 불러오는 중입니다/i)).toBeInTheDocument();
    expect(await screen.findByText(/부산대 앞 20평 상가 공실/i)).toBeInTheDocument();
    expect(screen.getByRole('list')).toBeInTheDocument();
  });

  it('키워드로 공간을 필터링한다', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SpacesPage />);

    await screen.findByText(/부산대 앞 20평 상가 공실/i);
    await user.type(screen.getByRole('textbox', { name: /공간 검색/i }), '서면');

    await waitFor(() => {
      expect(screen.getByText(/서면 지하 재배 공간/i)).toBeInTheDocument();
    });
  });

  it('주소 검색 시 반경 밖 공간이 목록에서 사라진다', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SpacesPage />);

    expect(await screen.findByText(/부산대 앞 20평 상가 공실/i)).toBeInTheDocument();
    // 기본 중심(부산시청) 반경 안이라 처음엔 서면 공간도 보인다(mock 지오코딩 fallback).
    await waitFor(() => {
      expect(screen.getByText(/서면 지하 재배 공간/i)).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText('중심 주소'), FAR_QUERY);
    await user.click(screen.getByRole('button', { name: /이 주변 검색/i }));

    await waitFor(() => {
      expect(screen.queryByText(/서면 지하 재배 공간/i)).not.toBeInTheDocument();
    });
  });

  it('빈 상태와 에러 상태를 보여준다', () => {
    const { rerender } = renderWithProviders(
      <SpaceList error={null} onRetry={() => undefined} spaces={[]} status="success" />,
    );

    expect(screen.getByText(/검색된 공간이 없습니다/i)).toBeInTheDocument();

    rerender(
      <SpaceList
        error="네트워크 오류"
        onRetry={() => undefined}
        spaces={[]}
        status="error"
      />,
    );
    expect(screen.getByText(/네트워크 오류/i)).toBeInTheDocument();
  });
});
