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
import { NearbyMap } from '@/components/map/NearbyMap';
import type { NearbyMapItem } from '@/components/map/useNearbyPlaces';

function getMapMock(): MapMock {
  if (!state.mapMock) throw new Error('kakaoSdk mock이 아직 초기화되지 않았습니다.');
  return state.mapMock;
}

interface TestPlace {
  id: number;
  name: string;
}

function mapItem(id: number): NearbyMapItem<TestPlace> {
  return {
    item: { id, name: `장소${id}` },
    coords: { lat: 35.18, lng: 129.076 },
    distanceKm: 0.5,
  };
}

describe('NearbyMap', () => {
  it('반경 내 아이템 수만큼 마커를 만든다', async () => {
    const mapMock = getMapMock();
    mapMock.markers.length = 0;
    render(
      <NearbyMap
        center={{ lat: 35.1798, lng: 129.075 }}
        radiusKm={5}
        items={[mapItem(1), mapItem(2)]}
        selectedId={null}
        onSelect={() => {}}
        getId={(item: TestPlace) => item.id}
        getTitle={(item: TestPlace) => item.name}
      />,
    );
    await waitFor(() => expect(mapMock.markers).toHaveLength(2));
  });

  it('마커 클릭 시 onSelect를 id로 부른다', async () => {
    const mapMock = getMapMock();
    mapMock.markers.length = 0;
    const onSelect = vi.fn();
    render(
      <NearbyMap
        center={{ lat: 35.1798, lng: 129.075 }}
        radiusKm={5}
        items={[mapItem(7)]}
        selectedId={null}
        onSelect={onSelect}
        getId={(item: TestPlace) => item.id}
        getTitle={(item: TestPlace) => item.name}
      />,
    );
    await waitFor(() => expect(mapMock.markers).toHaveLength(1));
    mapMock.markers[0].handlers.click?.();
    expect(onSelect).toHaveBeenCalledWith(7);
  });

  it('지도를 클릭하면 onMapClick에 클릭 좌표를 전달한다', async () => {
    const mapMock = getMapMock();
    const onMapClick = vi.fn();
    render(
      <NearbyMap
        center={{ lat: 35.1798, lng: 129.075 }}
        radiusKm={5}
        items={[]}
        selectedId={null}
        onSelect={() => {}}
        onMapClick={onMapClick}
        getId={(item: TestPlace) => item.id}
        getTitle={(item: TestPlace) => item.name}
      />,
    );
    // 지도 생성(비동기) 후 클릭 리스너가 붙을 때까지 기다렸다가 클릭을 흉내 낸다.
    await waitFor(() => {
      mapMock.clickMap(35.2, 129.1);
      expect(onMapClick).toHaveBeenCalledWith({ lat: 35.2, lng: 129.1 });
    });
  });
});
