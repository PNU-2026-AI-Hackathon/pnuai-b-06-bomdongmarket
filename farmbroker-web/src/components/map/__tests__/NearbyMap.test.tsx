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
  it('데이터가 같으면 부모 콜백 변경만으로 마커를 다시 만들지 않는다', async () => {
    const mapMock = getMapMock();
    mapMock.markers.length = 0;
    const items = [mapItem(1)];
    const props = {
      center: { lat: 35.1798, lng: 129.075 },
      radiusKm: 5,
      items,
      selectedId: null,
      onSelect: () => {},
      getId: (item: TestPlace) => item.id,
      getTitle: (item: TestPlace) => item.name,
    };

    const { rerender } = render(<NearbyMap {...props} />);
    await waitFor(() => expect(mapMock.markers).toHaveLength(1));

    rerender(
      <NearbyMap
        {...props}
        onSelect={() => {}}
        getId={(item) => item.id}
        getTitle={(item) => item.name}
      />,
    );

    expect(mapMock.markers).toHaveLength(1);
  });

  it('언마운트 후 재진입하면 이전 이벤트를 정리하고 지도를 다시 배치한다', async () => {
    const mapMock = getMapMock();
    mapMock.relayout.mockClear();
    mapMock.removeListener.mockClear();
    const props = {
      center: { lat: 35.1798, lng: 129.075 },
      radiusKm: 5,
      items: [] as NearbyMapItem<TestPlace>[],
      selectedId: null,
      onSelect: () => {},
      getId: (item: TestPlace) => item.id,
      getTitle: (item: TestPlace) => item.name,
    };

    const first = render(<NearbyMap {...props} />);
    await waitFor(() => expect(mapMock.relayout).toHaveBeenCalledTimes(1));

    first.unmount();
    expect(mapMock.removeListener).toHaveBeenCalledTimes(1);

    render(<NearbyMap {...props} />);
    await waitFor(() => expect(mapMock.relayout).toHaveBeenCalledTimes(2));
  });

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

  it('반경에 맞춰 지도 범위(setBounds)를 조정한다', async () => {
    const center = { lat: 35.1798, lng: 129.075 };
    render(
      <NearbyMap
        center={center}
        radiusKm={5}
        items={[]}
        selectedId={null}
        onSelect={() => {}}
        getId={(item: TestPlace) => item.id}
        getTitle={(item: TestPlace) => item.name}
      />,
    );
    // 위도 span은 반경의 함수(2 * radiusKm / 111)여야 한다 — 반경이 커지면 화면 범위도 넓어진다.
    // (공유 mock 상태의 stale 값을 피하려고 반경에 대응하는 정확한 값으로 수렴할 때까지 기다린다.)
    const expectedLatSpan = (2 * 5) / 111;
    await waitFor(() => {
      const b = getMapMock().getLastBounds();
      expect(b).not.toBeNull();
      expect(b!.ne.lat - b!.sw.lat).toBeCloseTo(expectedLatSpan, 3);
    });
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
