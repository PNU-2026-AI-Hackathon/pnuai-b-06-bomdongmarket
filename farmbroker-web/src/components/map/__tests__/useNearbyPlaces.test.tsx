import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import { useNearbyPlaces, type NearbyAdapter } from '@/components/map/useNearbyPlaces';

const geocodeAddress = vi.fn();
vi.mock('@/utils/geocode', async () => {
  const actual = await vi.importActual<typeof import('@/utils/geocode')>('@/utils/geocode');
  return { ...actual, geocodeAddress: (a: string) => geocodeAddress(a) };
});
// CI엔 앱키가 없어 hasKakaoMapKey=false → 폴백 스킵. 앰비언트 env 의존 제거.
vi.mock('@/utils/kakaoSdk', async () => {
  const actual = await vi.importActual<typeof import('@/utils/kakaoSdk')>('@/utils/kakaoSdk');
  return { ...actual, hasKakaoMapKey: () => true };
});

type Row = { id: number; lat: number | null; lng: number | null; addr: string | null };
const adapter: NearbyAdapter<Row> = {
  getId: (r) => r.id,
  getDirectCoords: (r) => (r.lat != null && r.lng != null ? { lat: r.lat, lng: r.lng } : null),
  getAddress: (r) => r.addr,
};
const center = { lat: 35.1798, lng: 129.075 };

describe('useNearbyPlaces', () => {
  beforeEach(() => geocodeAddress.mockReset());

  it('좌표 보완 대상이 없으면 불필요한 상태 갱신으로 다시 렌더하지 않는다', async () => {
    const empty: Row[] = [];
    let renderCount = 0;

    renderHook(() => {
      renderCount += 1;
      return useNearbyPlaces(empty, center, 5, adapter);
    });
    await act(async () => {
      await Promise.resolve();
    });

    expect(renderCount).toBe(1);
    expect(geocodeAddress).not.toHaveBeenCalled();
  });

  it('저장된 좌표로 반경 내/외를 나눈다', async () => {
    const near: Row = { id: 1, lat: 35.18, lng: 129.076, addr: null };
    const far: Row = { id: 2, lat: 35.4, lng: 129.3, addr: null };
    const { result } = renderHook(() => useNearbyPlaces([near, far], center, 5, adapter));
    await waitFor(() => expect(result.current.mapItems).toHaveLength(1));
    expect(result.current.mapItems[0].item.id).toBe(1);
  });

  it('좌표 없고 주소만 있으면 지오코딩 폴백', async () => {
    geocodeAddress.mockResolvedValue({ lat: 35.18, lng: 129.076 });
    const row: Row = { id: 3, lat: null, lng: null, addr: '부산 어딘가' };
    const { result } = renderHook(() => useNearbyPlaces([row], center, 5, adapter));
    await waitFor(() => expect(result.current.mapItems).toHaveLength(1));
    expect(geocodeAddress).toHaveBeenCalledWith('부산 어딘가');
  });

  it('좌표·주소 모두 없으면 반경 결과(지도·목록)에서 모두 제외한다', async () => {
    const located: Row = { id: 1, lat: 35.18, lng: 129.076, addr: null };
    const noLoc: Row = { id: 4, lat: null, lng: null, addr: null };
    const { result } = renderHook(() => useNearbyPlaces([located, noLoc], center, 5, adapter));
    await waitFor(() => expect(result.current.mapItems).toHaveLength(1));
    // 위치 미확정 항목은 "반경 km" 목록에 노출되지 않는다 — 지도 마커 수와 목록 수가 일치.
    expect(result.current.visibleItems.map((r) => r.id)).toEqual([1]);
  });

  it('지오코딩이 실패한 항목은 반경 결과에서 제외한다', async () => {
    geocodeAddress.mockResolvedValue(null);
    const failing: Row = { id: 5, lat: null, lng: null, addr: '못 찾는 주소' };
    const { result } = renderHook(() => useNearbyPlaces([failing], center, 5, adapter));
    await waitFor(() => expect(geocodeAddress).toHaveBeenCalled());
    expect(result.current.mapItems).toHaveLength(0);
    expect(result.current.visibleItems).toHaveLength(0);
  });
});
