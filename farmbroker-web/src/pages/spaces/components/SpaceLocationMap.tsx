import { useCallback, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/common/Button';
import { LoadingState } from '@/components/common/LoadingState';
import { hasKakaoMapKey, loadKakaoMaps } from '@/utils/kakaoSdk';

interface SpaceLocationMapProps {
  /** 우편번호 검색으로 고른 도로명 주소. 상세주소가 섞이면 지오코딩이 실패합니다. */
  address: string;
}

// 지도가 처음 잡을 확대 수준. 건물 한 채가 또렷하게 보이는 정도입니다.
const MAP_LEVEL = 3;

// 고른 주소가 실제로 어디인지 눈으로 확인할 수 있게 등록 폼 안에 지도를 띄웁니다.
// 좌표는 미리보기 용도로만 쓰고 서버에는 주소 문자열만 보냅니다.
export function SpaceLocationMap({ address }: SpaceLocationMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // 주소가 바뀔 때마다 지도를 새로 만들면 깜빡이므로 인스턴스를 붙들고 중심만 옮깁니다.
  const mapRef = useRef<KakaoMap | null>(null);
  const markerRef = useRef<KakaoMarker | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [reloadToken, setReloadToken] = useState(0);

  const isSupported = hasKakaoMapKey();

  const showMap = useCallback((maps: KakaoMaps, latitude: number, longitude: number) => {
    const position = new maps.LatLng(latitude, longitude);

    if (mapRef.current && markerRef.current) {
      mapRef.current.setCenter(position);
      markerRef.current.setPosition(position);
      return;
    }
    if (!containerRef.current) return;

    const map = new maps.Map(containerRef.current, {
      center: position,
      level: MAP_LEVEL,
    });
    map.relayout();
    mapRef.current = map;
    markerRef.current = new maps.Marker({ map, position });
  }, []);

  useEffect(
    () => () => {
      markerRef.current?.setMap(null);
      markerRef.current = null;
      mapRef.current = null;
    },
    [],
  );

  useEffect(() => {
    if (!isSupported || !address) return;

    // 주소를 연달아 바꾸면 이전 요청의 콜백이 늦게 도착할 수 있어 결과를 버립니다.
    let cancelled = false;
    setStatus('loading');

    const mapsRequest = reloadToken > 0 ? loadKakaoMaps({ retry: true }) : loadKakaoMaps();
    mapsRequest
      .then((maps) => {
        if (cancelled) return;

        new maps.services.Geocoder().addressSearch(address, (results, geocodeStatus) => {
          if (cancelled) return;

          const found = results[0];
          if (geocodeStatus !== maps.services.Status.OK || !found) {
            setStatus('error');
            return;
          }

          // 지오코더는 x가 경도, y가 위도이며 둘 다 문자열로 돌려줍니다.
          showMap(maps, Number(found.y), Number(found.x));
          setStatus('ready');
        });
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [address, isSupported, reloadToken, showMap]);

  // 주소를 고르기 전에는 지도 자리를 비워 둡니다.
  if (!address) return null;

  if (!isSupported) {
    return (
      <p className="rounded-app border border-line bg-surface-subtle p-3 text-xs font-medium text-content-subtle">
        지도 미리보기를 사용하려면 카카오 지도 앱키 설정이
        필요합니다.
      </p>
    );
  }

  return (
    <div>
      <p className="mb-2 text-xs font-medium text-content-subtle">
        선택한 주소 위치: {address}
      </p>
      {/* 지도 캔버스 자체는 스크린리더에 의미가 없어 위의 주소 문구로 대신 읽힙니다.
          컨테이너는 크기를 가진 채 항상 DOM에 남아 있어야 합니다 —
          숨긴 상태(0×0)에서 지도를 만들면 다시 보여줘도 빈 화면으로 남습니다. */}
      <div className="relative">
        <div
          aria-hidden
          className="h-56 w-full overflow-hidden rounded-app border border-line bg-surface-subtle"
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
            <Button
              onClick={() => setReloadToken((token) => token + 1)}
              size="sm"
              variant="outline"
            >
              지도 다시 불러오기
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
