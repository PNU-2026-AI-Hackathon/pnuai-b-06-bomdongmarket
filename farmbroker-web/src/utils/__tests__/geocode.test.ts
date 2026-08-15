import { describe, expect, it, vi, beforeEach } from 'vitest';

import { haversineKm, geocodeAddress, __resetGeocodeCache } from '@/utils/geocode';

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

const addressSearch = vi.fn();
vi.mock('@/utils/kakaoSdk', () => ({
  loadKakaoMaps: () =>
    Promise.resolve({
      services: {
        Geocoder: class {
          addressSearch = addressSearch;
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
