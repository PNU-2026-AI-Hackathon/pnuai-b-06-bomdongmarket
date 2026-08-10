import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SpaceLocationMap } from '@/pages/spaces/components/SpaceLocationMap';
import { hasKakaoMapKey, loadKakaoMaps } from '@/utils/kakaoSdk';

vi.mock('@/utils/kakaoSdk', () => ({
  hasKakaoMapKey: vi.fn(() => false),
  loadKakaoMaps: vi.fn(() => Promise.reject(new Error('앱키가 없습니다.'))),
}));

const hasKeyMock = vi.mocked(hasKakaoMapKey);
const loadMapsMock = vi.mocked(loadKakaoMaps);

const ADDRESS = '부산광역시 금정구 부산대학로63번길 2';
const OTHER_ADDRESS = '부산광역시 사하구 낙동대로 550';

// 지오코더는 x가 경도, y가 위도이며 둘 다 문자열로 돌려줍니다.
const COORDS: Record<string, { x: string; y: string }> = {
  [ADDRESS]: { x: '129.084', y: '35.231' },
  [OTHER_ADDRESS]: { x: '128.968', y: '35.104' },
};

// 지도 SDK 대신 생성자 호출만 기록하는 최소 구현을 씁니다.
function createFakeMaps() {
  const setCenter = vi.fn();
  const setPosition = vi.fn();
  const mapConstructor = vi.fn();
  const maps = {
    load: (callback: () => void) => callback(),
    LatLng: class {
      constructor(
        readonly latitude: number,
        readonly longitude: number,
      ) {}
    },
    Map: class {
      setCenter = setCenter;
      relayout = vi.fn();
      constructor(container: HTMLElement, options: unknown) {
        mapConstructor(container, options);
      }
    },
    Marker: class {
      setPosition = setPosition;
      setMap = vi.fn();
    },
    services: {
      Geocoder: class {
        addressSearch(
          address: string,
          callback: (results: unknown[], status: string) => void,
        ) {
          const found = COORDS[address];
          callback(found ? [found] : [], found ? 'OK' : 'ZERO_RESULT');
        }
      },
      Status: { OK: 'OK', ZERO_RESULT: 'ZERO_RESULT', ERROR: 'ERROR' },
    },
  };

  return { maps: maps as unknown as KakaoMaps, mapConstructor, setCenter, setPosition };
}

afterEach(() => {
  vi.clearAllMocks();
  hasKeyMock.mockReturnValue(false);
});

describe('SpaceLocationMap', () => {
  it('주소를 고르기 전에는 아무것도 그리지 않는다', () => {
    const { container } = render(<SpaceLocationMap address="" />);

    expect(container).toBeEmptyDOMElement();
    expect(loadMapsMock).not.toHaveBeenCalled();
  });

  // 앱키가 없어도 주소 검색과 등록 흐름은 끝까지 동작해야 합니다.
  it('앱키가 없으면 지도 대신 안내 문구를 보여주고 SDK를 부르지 않는다', () => {
    render(<SpaceLocationMap address={ADDRESS} />);

    expect(screen.getByText(/VITE_KAKAO_MAP_APP_KEY/)).toBeInTheDocument();
    expect(loadMapsMock).not.toHaveBeenCalled();
  });

  it('지도를 불러오지 못하면 다시 시도할 수 있게 안내한다', async () => {
    hasKeyMock.mockReturnValue(true);

    render(<SpaceLocationMap address={ADDRESS} />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '지도를 불러오지 못했습니다.',
    );
    expect(
      screen.getByRole('button', { name: '지도 다시 불러오기' }),
    ).toBeInTheDocument();
    await waitFor(() => expect(loadMapsMock).toHaveBeenCalledWith());
  });

  it('주소를 좌표로 바꿔 지도를 띄운다', async () => {
    hasKeyMock.mockReturnValue(true);
    const { maps, mapConstructor } = createFakeMaps();
    loadMapsMock.mockResolvedValue(maps);

    render(<SpaceLocationMap address={ADDRESS} />);

    await waitFor(() => expect(mapConstructor).toHaveBeenCalledTimes(1));
    expect(mapConstructor.mock.calls[0][1]).toMatchObject({
      center: { latitude: 35.231, longitude: 129.084 },
    });
    expect(screen.getByText(`선택한 주소 위치: ${ADDRESS}`)).toBeInTheDocument();
  });

  // 주소를 바꿀 때마다 지도를 새로 만들면 화면이 깜빡이고 인스턴스가 쌓입니다.
  it('주소가 바뀌면 지도를 새로 만들지 않고 중심만 옮긴다', async () => {
    hasKeyMock.mockReturnValue(true);
    const { maps, mapConstructor, setCenter, setPosition } = createFakeMaps();
    loadMapsMock.mockResolvedValue(maps);

    const { rerender } = render(<SpaceLocationMap address={ADDRESS} />);
    await waitFor(() => expect(mapConstructor).toHaveBeenCalledTimes(1));

    rerender(<SpaceLocationMap address={OTHER_ADDRESS} />);

    await waitFor(() => expect(setCenter).toHaveBeenCalledTimes(1));
    expect(setPosition).toHaveBeenCalledTimes(1);
    expect(mapConstructor).toHaveBeenCalledTimes(1);
    expect(setCenter.mock.calls[0][0]).toMatchObject({
      latitude: 35.104,
      longitude: 128.968,
    });
  });

  it('검색 결과가 없는 주소는 실패로 알린다', async () => {
    hasKeyMock.mockReturnValue(true);
    const { maps } = createFakeMaps();
    loadMapsMock.mockResolvedValue(maps);

    render(<SpaceLocationMap address="존재하지 않는 주소" />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '지도를 불러오지 못했습니다.',
    );
  });
});
