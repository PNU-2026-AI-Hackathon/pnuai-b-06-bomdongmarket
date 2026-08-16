import { describe, expect, it, vi, beforeEach } from 'vitest';

import { haversineKm, geocodeAddress, reverseGeocode, __resetGeocodeCache } from '@/utils/geocode';

describe('haversineKm', () => {
  it('부산시청 ↔ 해운대 거리를 근사한다(약 8km)', () => {
    const busanCityHall = { lat: 35.1798, lng: 129.075 };
    const haeundae = { lat: 35.1587, lng: 129.1604 };
    const d = haversineKm(busanCityHall, haeundae);
    expect(d).toBeGreaterThan(7);
    expect(d).toBeLessThan(10);
  });

  it('같은 좌표는 0', () => {
    const p = { lat: 35.1, lng: 129.0 };
    expect(haversineKm(p, p)).toBeCloseTo(0, 5);
  });
});

// vi.mock 팩토리는 파일 최상단으로 호이스팅되므로, 팩토리가 참조하는 값은 vi.hoisted로 만든다.
// addressSearch는 vi.fn으로 두지만, coord2Address는 vi.fn+mockReset/Clear 조합에서
// 유령 호출(cb 누락) 문제가 있어 홀더를 읽는 순수 메서드로 둔다.
const { addressSearch } = vi.hoisted(() => ({ addressSearch: vi.fn() }));
const coord2 = vi.hoisted(() => ({
  result: [] as unknown[],
  status: 'OK',
  calledWith: null as [number, number] | null,
}));
vi.mock('@/utils/kakaoSdk', () => ({
  loadKakaoMaps: () =>
    Promise.resolve({
      services: {
        Geocoder: class {
          addressSearch = addressSearch;
          coord2Address(longitude: number, latitude: number, cb: (r: unknown[], s: string) => void) {
            coord2.calledWith = [longitude, latitude];
            cb(coord2.result, coord2.status);
          }
        },
        Status: { OK: 'OK', ZERO_RESULT: 'ZERO_RESULT', ERROR: 'ERROR' },
      },
    }),
}));

describe('geocodeAddress', () => {
  beforeEach(() => {
    __resetGeocodeCache();
    addressSearch.mockReset();
  });

  it('주소를 좌표로 변환한다(x=lng, y=lat)', async () => {
    addressSearch.mockImplementation((_addr: string, cb: (r: unknown[], s: string) => void) =>
      cb([{ x: '129.075', y: '35.1798', address_name: '부산' }], 'OK'),
    );
    const coords = await geocodeAddress('부산광역시청');
    expect(coords).toEqual({ lat: 35.1798, lng: 129.075 });
  });

  it('같은 주소는 캐시로 재요청하지 않는다', async () => {
    addressSearch.mockImplementation((_addr: string, cb: (r: unknown[], s: string) => void) =>
      cb([{ x: '129.075', y: '35.1798', address_name: '부산' }], 'OK'),
    );
    await geocodeAddress('부산광역시청');
    await geocodeAddress('부산광역시청');
    expect(addressSearch).toHaveBeenCalledTimes(1);
  });

  it('결과가 없으면 null(실패는 캐시하지 않음)', async () => {
    addressSearch.mockImplementation((_addr: string, cb: (r: unknown[], s: string) => void) =>
      cb([], 'ZERO_RESULT'),
    );
    expect(await geocodeAddress('없는주소')).toBeNull();
    await geocodeAddress('없는주소');
    expect(addressSearch).toHaveBeenCalledTimes(2);
  });
});

describe('reverseGeocode', () => {
  beforeEach(() => {
    coord2.result = [];
    coord2.status = 'OK';
    coord2.calledWith = null;
  });

  it('좌표를 주소 라벨로 변환한다(도로명 우선, 인자는 lng·lat 순서)', async () => {
    coord2.result = [
      {
        road_address: { address_name: '부산 금정구 부산대학로63번길 2' },
        address: { address_name: '부산 금정구 장전동 30' },
      },
    ];
    const label = await reverseGeocode({ lat: 35.2314, lng: 129.0838 });
    expect(label).toBe('부산 금정구 부산대학로63번길 2');
    // coord2Address 인자 순서는 (경도, 위도)여야 한다.
    expect(coord2.calledWith).toEqual([129.0838, 35.2314]);
  });

  it('도로명주소가 없으면 지번주소로 폴백한다', async () => {
    coord2.result = [{ road_address: null, address: { address_name: '부산 금정구 장전동' } }];
    expect(await reverseGeocode({ lat: 35.23, lng: 129.08 })).toBe('부산 금정구 장전동');
  });

  it('결과가 없으면 null', async () => {
    coord2.result = [];
    coord2.status = 'ZERO_RESULT';
    expect(await reverseGeocode({ lat: 0, lng: 0 })).toBeNull();
  });
});
