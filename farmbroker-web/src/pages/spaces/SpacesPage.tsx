import { Plus } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { Card } from '@/components/common/Card';
import { PageHeader } from '@/components/common/PageHeader';
import { buttonStyles } from '@/components/common/buttonStyles';
import { PageContainer } from '@/components/layout/PageContainer';
import { NearbyMap } from '@/components/map/NearbyMap';
import { NearbyMapSearch } from '@/components/map/NearbyMapSearch';
import { type NearbyAdapter, useNearbyPlaces } from '@/components/map/useNearbyPlaces';
import { DEFAULT_MAP_CENTER, DEFAULT_RADIUS_KM } from '@/constants/geo';
import { ROUTES } from '@/constants/routes';
import { SpaceFilter } from '@/pages/spaces/components/SpaceFilter';
import { SpaceList } from '@/pages/spaces/components/SpaceList';
import { useSpaces } from '@/pages/spaces/hooks/useSpaces';
import type { SpaceSummary } from '@/types/api';
import type { Coords } from '@/utils/geocode';
import { hasKakaoMapKey } from '@/utils/kakaoSdk';

// 공개 공간 탐색 화면입니다. API 명세의 검색/필터/정렬 조건을 mock 서비스와 연결합니다.
export function SpacesPage() {
  const { filters, setFilters, spaces, status, error, reload } = useSpaces();

  const [center, setCenter] = useState<Coords>(DEFAULT_MAP_CENTER);
  const [centerLabel, setCenterLabel] = useState('부산시청');
  const [radiusKm, setRadiusKm] = useState(DEFAULT_RADIUS_KM);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const cardRefs = useRef(new Map<number, HTMLLIElement>());

  const mapSupported = hasKakaoMapKey();
  const spaceAdapter = useMemo<NearbyAdapter<SpaceSummary>>(
    () => ({
      getId: (s) => s.spaceId,
      getDirectCoords: (s) =>
        s.latitude != null && s.longitude != null ? { lat: s.latitude, lng: s.longitude } : null,
      getAddress: (s) => s.address ?? null,
    }),
    [],
  );
  const { mapItems, visibleItems, distances } = useNearbyPlaces(
    spaces.content,
    center,
    radiusKm,
    spaceAdapter,
  );
  // 앱키가 없으면 반경 개념이 없으므로 서버(면적/월세/정렬 필터 적용됨)가 준 목록을 그대로 보인다.
  const gridItems = mapSupported ? visibleItems : spaces.content;

  function handleSelect(spaceId: number) {
    setSelectedId(spaceId);
    cardRefs.current.get(spaceId)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  return (
    <PageContainer>
      <PageHeader
        action={
          <Link
            className={buttonStyles({ className: 'w-full sm:w-auto' })}
            to={ROUTES.newSpace}
          >
            <Plus className="h-5 w-5" aria-hidden />
            공간 등록
          </Link>
        }
        description="지역명, 면적, 월세를 비교하고 상세 화면에서 공간 매칭 신청을 진행할 수 있습니다."
        eyebrow="공간"
        title="스마트팜으로 전환 가능한 도심 공간 찾기"
      />

      {mapSupported ? (
        <Card className="mt-6 grid gap-4" padding="md">
          <NearbyMapSearch
            placeholder="예: 부산광역시 금정구 장전동"
            radiusKm={radiusKm}
            onRadiusChange={setRadiusKm}
            onCenterChange={(coords, label) => {
              setCenter(coords);
              setCenterLabel(label);
            }}
          />
          <NearbyMap
            center={center}
            radiusKm={radiusKm}
            items={mapItems}
            selectedId={selectedId}
            onSelect={handleSelect}
            getId={(s) => s.spaceId}
            getTitle={(s) => s.title}
          />
          <p className="text-xs font-medium text-content-subtle">
            <span className="font-bold text-action">{centerLabel}</span> 반경 {radiusKm}km · 공간{' '}
            {mapItems.length}곳
          </p>
        </Card>
      ) : null}

      <div className="mt-6">
        <SpaceFilter filters={filters} onChange={setFilters} />
      </div>

      <div className="mt-6">
        <SpaceList
          distances={distances}
          error={error}
          onCardRef={(spaceId, el) => {
            if (el) cardRefs.current.set(spaceId, el);
            else cardRefs.current.delete(spaceId);
          }}
          onRetry={reload}
          selectedId={selectedId}
          spaces={gridItems}
          status={status}
        />
      </div>
    </PageContainer>
  );
}
