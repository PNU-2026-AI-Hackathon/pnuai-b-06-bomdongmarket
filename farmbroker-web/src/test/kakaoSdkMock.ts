import { screen, waitFor } from '@testing-library/react';
import type userEvent from '@testing-library/user-event';
import { expect, vi } from 'vitest';

// jsdom에서는 카카오 CDN 스크립트를 받을 수 없어 SDK 로더를 통째로 대체합니다.
// 주소 입력이 들어간 화면 테스트가 모두 같은 가짜 검색 결과를 쓰도록 여기에 모아 둡니다.

export const SEARCHED_ADDRESS = '부산광역시 금정구 부산대학로63번길 2';

const SEARCHED_POSTCODE_DATA = {
  roadAddress: SEARCHED_ADDRESS,
  jibunAddress: '부산광역시 금정구 장전동 30',
  zonecode: '46241',
  buildingName: '',
  bname: '장전동',
};

// vi.mock의 팩토리는 호이스팅되므로 반드시 동적 import로 불러와야 합니다.
// 예) vi.mock('@/utils/kakaoSdk', async () => (await import('@/test/kakaoSdkMock')).createKakaoSdkMock());
export function createKakaoSdkMock() {
  return {
    // 지도는 앱키가 없는 상태로 두어 테스트가 지도 SDK를 건드리지 않게 합니다.
    hasKakaoMapKey: () => false,
    loadKakaoMaps: () => Promise.reject(new Error('테스트에서는 지도를 쓰지 않습니다.')),
    // 팝업을 띄우는 대신 open() 즉시 검색 결과를 고른 것처럼 동작합니다.
    loadPostcodeScript: () =>
      Promise.resolve(
        class {
          constructor(private options: { oncomplete: (data: unknown) => void }) {}
          open() {
            this.options.oncomplete(SEARCHED_POSTCODE_DATA);
          }
        },
      ),
  };
}

/** 주소는 검색 팝업으로만 채울 수 있으므로 폼 테스트는 이 헬퍼로 값을 받아옵니다. */
export async function searchAddress(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: '주소 검색' }));
  await waitFor(() => {
    expect(screen.getByLabelText('주소')).toHaveValue(SEARCHED_ADDRESS);
  });
}

// 지도 마커/원을 만드는 화면(MarketMap) 테스트용. 생성된 마커 수 등을 관찰할 수 있게
// 간단한 가짜 maps 네임스페이스를 돌려준다. hasKakaoMapKey는 true.
export function createKakaoMapMock() {
  const markers: Array<{ position: unknown; handlers: Record<string, () => void> }> = [];
  // 지도에 등록된 이벤트 핸들러를 관찰해 클릭을 흉내 낼 수 있게 붙든다.
  // (this 자체가 아니라 handlers 객체만 잡아 no-this-alias 규칙을 피한다.)
  let mapHandlers: Record<string, (e: unknown) => void> | null = null;
  // setBounds로 맞춘 마지막 범위 — 반경 변경 시 화면 조정을 검증할 때 관찰한다.
  let lastBounds: { sw: { lat: number; lng: number }; ne: { lat: number; lng: number } } | null =
    null;
  const relayout = vi.fn();
  const removeListener = vi.fn(
    (
      target: { handlers?: Record<string, (event: unknown) => void> },
      type: string,
      handler: (event: unknown) => void,
    ) => {
      if (target.handlers?.[type] === handler) delete target.handlers[type];
    },
  );

  const maps = {
    load: (cb: () => void) => cb(),
    LatLng: class {
      constructor(
        public lat: number,
        public lng: number,
      ) {}
      getLat() {
        return this.lat;
      }
      getLng() {
        return this.lng;
      }
    },
    Map: class {
      handlers: Record<string, (e: unknown) => void> = {};
      constructor() {
        mapHandlers = this.handlers;
      }
      setCenter() {}
      setLevel() {}
      setBounds(bounds: { sw: KakaoLatLng; ne: KakaoLatLng }) {
        lastBounds = {
          sw: { lat: bounds.sw.getLat(), lng: bounds.sw.getLng() },
          ne: { lat: bounds.ne.getLat(), lng: bounds.ne.getLng() },
        };
      }
      relayout() {
        relayout();
      }
    },
    LatLngBounds: class {
      constructor(
        public sw: KakaoLatLng,
        public ne: KakaoLatLng,
      ) {}
    },
    Marker: class {
      handlers: Record<string, () => void> = {};
      constructor(public options: { position: unknown }) {
        markers.push({ position: options.position, handlers: this.handlers });
      }
      setPosition() {}
      setMap() {}
    },
    Circle: class {
      setMap() {}
      setPosition() {}
      setRadius() {}
    },
    event: {
      addListener: (
        target: { handlers?: Record<string, () => void> },
        type: string,
        handler: () => void,
      ) => {
        if (target.handlers) target.handlers[type] = handler;
      },
      removeListener,
    },
    services: {
      Geocoder: class {
        addressSearch(_a: string, cb: (r: unknown[], s: string) => void) {
          cb([{ x: '129.075', y: '35.1798', address_name: '부산' }], 'OK');
        }
        coord2Address(_lng: number, _lat: number, cb: (r: unknown[], s: string) => void) {
          cb(
            [
              {
                road_address: { address_name: '부산 금정구 부산대학로63번길 2' },
                address: { address_name: '부산 금정구 장전동 30' },
              },
            ],
            'OK',
          );
        }
      },
      Status: { OK: 'OK', ZERO_RESULT: 'ZERO_RESULT', ERROR: 'ERROR' },
    },
  };

  return {
    markers,
    // 지도 클릭을 흉내 낸다 — 최초 생성된 지도에 등록된 click 핸들러를 좌표와 함께 호출한다.
    clickMap: (lat: number, lng: number) =>
      mapHandlers?.click?.({ latLng: new maps.LatLng(lat, lng) }),
    // setBounds로 맞춘 마지막 범위(반경 변경 시 화면 조정 검증용).
    getLastBounds: () => lastBounds,
    relayout,
    removeListener,
    module: {
      hasKakaoMapKey: () => true,
      loadKakaoMaps: () => Promise.resolve(maps as unknown as KakaoMaps),
      loadPostcodeScript: () => Promise.reject(new Error('이 mock은 지도만 담당합니다.')),
    },
  };
}
