import { render, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { createKakaoMapMock } from '@/test/kakaoSdkMock';

type MapMock = ReturnType<typeof createKakaoMapMock>;

// ESM에서는 정적 import가 이 파일의 최상단 코드보다 먼저 실행되므로,
// vi.mock 밖에서 만든 const를 팩토리가 참조하면 TDZ 에러가 난다(mapMock.markers 관찰 불가).
// vi.hoisted로 만든 컨테이너는 그 어떤 import보다도 먼저 초기화되므로 안전하게 공유할 수 있다.
const state = vi.hoisted<{ mapMock: MapMock | null }>(() => ({ mapMock: null }));

vi.mock('@/utils/kakaoSdk', async () => {
  const { createKakaoMapMock } = await import('@/test/kakaoSdkMock');
  state.mapMock = createKakaoMapMock();
  return state.mapMock.module;
});

// mock 이후에 import(호이스팅 회피)
import { MarketMap } from '@/pages/market/components/MarketMap';
import type { MapItem } from '@/pages/market/hooks/useNearbyItems';

function getMapMock(): MapMock {
  if (!state.mapMock) throw new Error('kakaoSdk mock이 아직 초기화되지 않았습니다.');
  return state.mapMock;
}

function mapItem(productId: number): MapItem {
  return {
    item: { productId, name: `상품${productId}` } as never,
    coords: { lat: 35.18, lng: 129.076 },
    distanceKm: 0.5,
  };
}

describe('MarketMap', () => {
  it('반경 내 아이템 수만큼 마커를 만든다', async () => {
    const mapMock = getMapMock();
    mapMock.markers.length = 0;
    render(
      <MarketMap
        center={{ lat: 35.1798, lng: 129.075 }}
        radiusKm={5}
        items={[mapItem(1), mapItem(2)]}
        selectedId={null}
        onSelect={() => {}}
      />,
    );
    await waitFor(() => expect(mapMock.markers).toHaveLength(2));
  });

  it('마커 클릭 시 onSelect를 productId로 부른다', async () => {
    const mapMock = getMapMock();
    mapMock.markers.length = 0;
    const onSelect = vi.fn();
    render(
      <MarketMap
        center={{ lat: 35.1798, lng: 129.075 }}
        radiusKm={5}
        items={[mapItem(7)]}
        selectedId={null}
        onSelect={onSelect}
      />,
    );
    await waitFor(() => expect(mapMock.markers).toHaveLength(1));
    mapMock.markers[0].handlers.click?.();
    expect(onSelect).toHaveBeenCalledWith(7);
  });
});
