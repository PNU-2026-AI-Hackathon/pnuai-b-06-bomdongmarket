import type { Coords } from '@/utils/geocode';

// 지도 검색 진입 시 기본 중심 — 부산시청. 사용자가 주소를 검색하면 갱신된다.
export const DEFAULT_MAP_CENTER: Coords = { lat: 35.1798, lng: 129.075 };

// 반경 셀렉터 옵션(km)과 기본값.
export const RADIUS_OPTIONS_KM = [1, 3, 5, 10] as const;
export const DEFAULT_RADIUS_KM = 5;
