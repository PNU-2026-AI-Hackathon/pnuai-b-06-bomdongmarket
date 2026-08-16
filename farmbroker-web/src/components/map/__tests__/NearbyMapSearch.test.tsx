import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

const geocodeAddress = vi.fn();
vi.mock('@/utils/geocode', async () => {
  const actual = await vi.importActual<typeof import('@/utils/geocode')>('@/utils/geocode');
  return { ...actual, geocodeAddress: (a: string) => geocodeAddress(a) };
});

import { NearbyMapSearch } from '@/components/map/NearbyMapSearch';

describe('NearbyMapSearch', () => {
  it('주소 입력 후 제출하면 지오코딩 결과로 onCenterChange를 부른다', async () => {
    geocodeAddress.mockResolvedValue({ lat: 35.18, lng: 129.076 });
    const onCenterChange = vi.fn();
    const user = userEvent.setup();

    render(
      <NearbyMapSearch
        radiusKm={5}
        onRadiusChange={() => {}}
        onCenterChange={onCenterChange}
      />,
    );

    await user.type(screen.getByLabelText('중심 주소'), '부산 금정구');
    await user.click(screen.getByRole('button', { name: '이 주변 검색' }));

    await waitFor(() =>
      expect(onCenterChange).toHaveBeenCalledWith({ lat: 35.18, lng: 129.076 }, '부산 금정구'),
    );
  });

  it('placeholder prop을 입력에 반영한다', () => {
    render(
      <NearbyMapSearch
        radiusKm={5}
        onRadiusChange={() => {}}
        onCenterChange={() => {}}
        placeholder="예: 부산광역시 금정구 장전동"
      />,
    );

    expect(screen.getByPlaceholderText('예: 부산광역시 금정구 장전동')).toBeInTheDocument();
  });
});
