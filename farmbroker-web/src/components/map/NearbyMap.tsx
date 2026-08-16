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

  const isSupported = hasKakaoMapKey();

  // 지도 준비(1회) — center는 준비 후 별도 effect에서 옮긴다.
  useEffect(() => {
    if (!isSupported) return;
    let cancelled = false;
    setStatus('loading');
    loadKakaoMaps()
      .then((maps) => {
        if (cancelled || !containerRef.current) return;
        mapsRef.current = maps;
        if (!mapRef.current) {
          mapRef.current = new maps.Map(containerRef.current, {
            center: new maps.LatLng(center.lat, center.lng),
            level: MAP_LEVEL,
          });
        }
        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
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
    map.setCenter(centerLatLng);

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
        title: getTitle(item),
      });
      maps.event.addListener(marker, 'click', () => onSelect(getId(item)));
      markersRef.current.push(marker);
    }
  }, [center, radiusKm, items, onSelect, getId, getTitle]);

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
