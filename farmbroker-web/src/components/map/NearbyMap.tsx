import { useCallback, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/common/Button';
import { LoadingState } from '@/components/common/LoadingState';
import type { NearbyMapItem } from '@/components/map/useNearbyPlaces';
import type { Coords } from '@/utils/geocode';
import { hasKakaoMapKey, loadKakaoMaps } from '@/utils/kakaoSdk';

interface NearbyMapProps<T> {
  center: Coords;
  radiusKm: number;
  items: NearbyMapItem<T>[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  getId: (item: T) => number;
  getTitle: (item: T) => string;
  /** 지도를 클릭하면 그 지점 좌표로 호출된다(주변 검색 중심 이동용). 선택 사항. */
  onMapClick?: (coords: Coords) => void;
}

const MAP_LEVEL = 6; // 반경 수 km가 한눈에 들어오는 수준

export function NearbyMap<T>({
  center,
  radiusKm,
  items,
  selectedId,
  onSelect,
  getId,
  getTitle,
  onMapClick,
}: NearbyMapProps<T>) {
  // Task 7에서 그리드 강조에 사용할 예정 — 지금은 소비만 해서 lint의 미사용 경고를 피한다.
  void selectedId;

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<KakaoMap | null>(null);
  const mapsRef = useRef<KakaoMaps | null>(null);
  const markersRef = useRef<KakaoMarker[]>([]);
  const circleRef = useRef<KakaoCircle | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [reloadToken, setReloadToken] = useState(0);

  // 클릭 리스너는 지도 생성 시 1회만 등록하므로, 최신 콜백을 ref로 참조해 stale closure를 피한다.
  const onMapClickRef = useRef(onMapClick);
  onMapClickRef.current = onMapClick;
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const getIdRef = useRef(getId);
  getIdRef.current = getId;
  const getTitleRef = useRef(getTitle);
  getTitleRef.current = getTitle;

  const isSupported = hasKakaoMapKey();

  // 지도 준비(1회) — center는 준비 후 별도 effect에서 옮긴다.
  useEffect(() => {
    if (!isSupported) return;
    let cancelled = false;
    let relayoutFrame: number | null = null;
    let clickHandler: ((mouseEvent: KakaoMapMouseEvent) => void) | null = null;
    setStatus('loading');
    const mapsRequest = reloadToken > 0 ? loadKakaoMaps({ retry: true }) : loadKakaoMaps();
    mapsRequest
      .then((maps) => {
        if (cancelled || !containerRef.current) return;
        mapsRef.current = maps;
        if (!mapRef.current) {
          const map = new maps.Map(containerRef.current, {
            center: new maps.LatLng(center.lat, center.lng),
            level: MAP_LEVEL,
          });
          // 지도 빈 곳 클릭 → 그 지점을 주변 검색 중심으로. 리스너는 여기서 딱 한 번 건다.
          clickHandler = (mouseEvent) => {
            const latLng = mouseEvent.latLng;
            onMapClickRef.current?.({ lat: latLng.getLat(), lng: latLng.getLng() });
          };
          maps.event.addListener(map, 'click', clickHandler);
          mapRef.current = map;
        }
        const map = mapRef.current;
        if (!map) return;
        // SPA 뒤로가기로 다시 마운트될 때 최종 컨테이너 크기를 기준으로 좌표계를 맞춘다.
        relayoutFrame = window.requestAnimationFrame(() => {
          if (cancelled || mapRef.current !== map) return;
          map.relayout();
          setStatus('ready');
        });
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
      if (relayoutFrame !== null) window.cancelAnimationFrame(relayoutFrame);

      const maps = mapsRef.current;
      const map = mapRef.current;
      if (maps && map && clickHandler) {
        maps.event.removeListener(map, 'click', clickHandler);
      }
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];
      circleRef.current?.setMap(null);
      circleRef.current = null;
      mapRef.current = null;
      mapsRef.current = null;
    };
    // center는 여기서 의도적으로 제외 — 재생성 방지(아래 effect가 이동 담당).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSupported, reloadToken]);

  // 마커·원 다시 그리기
  const redraw = useCallback(() => {
    const maps = mapsRef.current;
    const map = mapRef.current;
    if (!maps || !map) return;

    const centerLatLng = new maps.LatLng(center.lat, center.lng);
    // 반경(1/3/5/10km)이 화면에 한눈에 들어오도록 원의 외접 사각형에 맞춰 지도를 맞춘다.
    // (setBounds가 중심·확대수준을 함께 조정하므로 반경을 바꿔도 경계 마커가 화면 밖으로 나가지 않는다.)
    const latDelta = radiusKm / 111; // 위도 1도 ≈ 111km
    const lngDelta = radiusKm / (111 * Math.cos((center.lat * Math.PI) / 180));
    map.setBounds(
      new maps.LatLngBounds(
        new maps.LatLng(center.lat - latDelta, center.lng - lngDelta),
        new maps.LatLng(center.lat + latDelta, center.lng + lngDelta),
      ),
    );

    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    circleRef.current?.setMap(null);

    circleRef.current = new maps.Circle({
      center: centerLatLng,
      radius: radiusKm * 1000,
      strokeWeight: 2,
      strokeColor: '#2f855a',
      strokeOpacity: 0.6,
      fillColor: '#38a169',
      fillOpacity: 0.08,
    });
    circleRef.current.setMap(map);

    for (const { item, coords } of items) {
      const marker = new maps.Marker({
        map,
        position: new maps.LatLng(coords.lat, coords.lng),
        title: getTitleRef.current(item),
      });
      maps.event.addListener(marker, 'click', () =>
        onSelectRef.current(getIdRef.current(item)),
      );
      markersRef.current.push(marker);
    }
  }, [center, radiusKm, items]);

  useEffect(() => {
    if (status === 'ready') redraw();
  }, [status, redraw]);

  if (!isSupported) {
    return (
      <p className="rounded-app border border-line bg-surface-subtle p-3 text-xs font-medium text-content-subtle">
        지도를 사용하려면 카카오 지도 앱키 설정이 필요합니다. 아래 목록으로 계속 탐색할 수 있습니다.
      </p>
    );
  }

  return (
    <div className="relative">
      <div
        aria-hidden
        className="h-72 w-full overflow-hidden rounded-app border border-line bg-surface-subtle"
        ref={containerRef}
      />
      {status === 'loading' ? (
        <div className="absolute inset-0">
          <LoadingState label="지도를 불러오는 중입니다" />
        </div>
      ) : null}
      {status === 'error' ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-app border border-line bg-surface px-4 text-center">
          <p className="text-xs font-medium text-content-muted" role="alert">
            지도를 불러오지 못했습니다.
          </p>
          <Button onClick={() => setReloadToken((t) => t + 1)} size="sm" variant="outline">
            지도 다시 불러오기
          </Button>
        </div>
      ) : null}
    </div>
  );
}
