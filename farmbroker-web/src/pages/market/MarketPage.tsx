import { Heart, Plus, Search, Store } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '@/auth/authContext';
import { buttonStyles } from '@/components/common/buttonStyles';
import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Input } from '@/components/common/Input';
import { LoadingState } from '@/components/common/LoadingState';
import { PageHeader } from '@/components/common/PageHeader';
import { PageContainer } from '@/components/layout/PageContainer';
import { NearbyMap } from '@/components/map/NearbyMap';
import { NearbyMapSearch } from '@/components/map/NearbyMapSearch';
import { type NearbyAdapter, useNearbyPlaces } from '@/components/map/useNearbyPlaces';
import { ProductCard } from '@/pages/market/components/ProductCard';
import { marketCategories } from '@/pages/market/constants/marketOptions';
import { useMarketItems } from '@/pages/market/hooks/useMarketItems';
import { useWishedIds } from '@/pages/market/hooks/useWishedIds';
import type { MarketCategory } from '@/pages/market/types';
import { DEFAULT_MAP_CENTER, DEFAULT_RADIUS_KM } from '@/constants/geo';
import { ROUTES } from '@/constants/routes';
import type { MarketItem } from '@/types/api';
import { type Coords, reverseGeocode } from '@/utils/geocode';
import { hasKakaoMapKey } from '@/utils/kakaoSdk';

// 소비자가 근처 스마트팜 상품을 검색하고 담을 수 있는 로컬 마켓 화면입니다.
export function MarketPage() {
  const { keyword, setKeyword, category, setCategory, items, status, error, reload } =
    useMarketItems();
  const { isAuthenticated } = useAuth();
  // 카드 하트는 이 집합으로 초기 상태를 잡습니다 — 없으면 이미 찜한 상품도 빈 하트로 보입니다.
  const wishedIds = useWishedIds(isAuthenticated);

  const [center, setCenter] = useState<Coords>(DEFAULT_MAP_CENTER);
  const [centerLabel, setCenterLabel] = useState('부산시청');
  const [radiusKm, setRadiusKm] = useState(DEFAULT_RADIUS_KM);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const cardRefs = useRef(new Map<number, HTMLDivElement>());

  const mapSupported = hasKakaoMapKey();
  const productAdapter = useMemo<NearbyAdapter<MarketItem>>(
    () => ({
      getId: (i) => i.productId,
      getDirectCoords: (i) =>
        i.latitude != null && i.longitude != null ? { lat: i.latitude, lng: i.longitude } : null,
      getAddress: (i) => i.address ?? null,
    }),
    [],
  );
  // 로딩·에러 중에는 지도에 이전 조건의 마커가 남지 않도록 성공 상태의 목록만 넘긴다
  // (지도와 아래 목록의 상태가 어긋나 보이는 것을 막는다).
  const mapSourceItems = status === 'success' ? items : [];
  const { mapItems, visibleItems, distances } = useNearbyPlaces(
    mapSourceItems,
    center,
    radiusKm,
    productAdapter,
  );
  // 앱키가 없으면 반경 개념이 없으므로 서버가 준 전체를 그대로 보인다.
  const gridItems = mapSupported ? visibleItems : items;

  function handleSelect(productId: number) {
    setSelectedId(productId);
    cardRefs.current.get(productId)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // 지도 빈 곳을 클릭하면 그 지점을 검색 중심으로 삼고, 역지오코딩으로 지명 라벨을 붙인다.
  async function handleMapClick(coords: Coords) {
    setCenter(coords);
    setSelectedId(null);
    setCenterLabel('선택한 위치');
    const label = await reverseGeocode(coords).catch(() => null);
    if (label) setCenterLabel(label);
  }

  return (
    <PageContainer>
      <PageHeader
        action={
          <div className="flex flex-wrap items-center gap-2">
            {/* 찜은 로그인해야 서버에 저장되므로 로그인한 사람에게만 보입니다. */}
            {isAuthenticated ? (
              <Link
                className={buttonStyles({ size: 'sm', variant: 'outline' })}
                to={ROUTES.wishlist}
              >
                <Heart className="h-4 w-4" aria-hidden />
                찜
              </Link>
            ) : null}
            {/* 판매 관리는 내 상품이 있어야 의미가 있어 로그인한 사람에게만 보입니다. */}
            {isAuthenticated ? (
              <Link
                className={buttonStyles({ size: 'sm', variant: 'outline' })}
                to={ROUTES.myProducts}
              >
                <Store className="h-4 w-4" aria-hidden />
                판매 관리
              </Link>
            ) : null}
            {/* 등록 진입점은 비로그인에도 보여 줍니다. 무엇을 할 수 있는 서비스인지 먼저 알리고,
                누르면 ProtectedRoute가 로그인으로 보냈다가 로그인 후 이 화면으로 되돌립니다. */}
            <Link className={buttonStyles()} to={ROUTES.newProduct}>
              <Plus className="h-5 w-5" aria-hidden />
              상품 등록
            </Link>
          </div>
        }
        actionBreakpoint="lg"
        description="수확일, 푸드 마일리지, 생산 이력을 견줘 보고 마음에 들면 찜해 두세요."
        eyebrow="로컬 마켓"
        title="가까운 스마트팜에서 온 신선한 농산물"
      />

      {mapSupported ? (
        <Card className="mt-6 grid gap-4" padding="md">
          <NearbyMapSearch
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
            onMapClick={handleMapClick}
            getId={(i) => i.productId}
            getTitle={(i) => i.name}
          />
          <p className="text-xs font-medium text-content-subtle">
            <span className="font-bold text-action">{centerLabel}</span> 반경 {radiusKm}km · 상품{' '}
            {mapItems.length}곳
          </p>
        </Card>
      ) : null}

      <Card className="mt-6 grid gap-3 lg:grid-cols-[1fr_auto]" padding="md">
        <Input
          aria-label="상품 검색"
          icon={<Search className="h-4 w-4" aria-hidden />}
          placeholder="농산물 또는 농장 검색"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          {marketCategories.map((option) => (
            <button
              key={option}
              className={`min-h-control rounded-full px-3 text-sm font-bold transition ${
                category === option
                  ? 'bg-leaf-700 text-white'
                  : 'bg-leaf-50 text-leaf-800 hover:bg-leaf-100'
              }`}
              onClick={() => setCategory(option as MarketCategory)}
              type="button"
            >
              {option}
            </button>
          ))}
        </div>
      </Card>

      <div className="mt-6">
        {status === 'loading' || status === 'idle' ? (
          <LoadingState label="로컬 상품을 불러오는 중입니다" />
        ) : null}
        {status === 'error' ? (
          <ErrorState
            message={error ?? '마켓 상품을 불러오지 못했습니다'}
            onRetry={reload}
          />
        ) : null}
        {status === 'success' && gridItems.length === 0 ? (
          <EmptyState
            title="검색된 상품이 없습니다"
            description="다른 카테고리를 선택하거나 가까운 농장을 검색해보세요."
          />
        ) : null}
        {status === 'success' && gridItems.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {gridItems.map((item) => (
              <div
                key={item.productId}
                ref={(el) => {
                  if (el) cardRefs.current.set(item.productId, el);
                  else cardRefs.current.delete(item.productId);
                }}
                className={
                  selectedId === item.productId ? 'rounded-app ring-2 ring-leaf-500' : undefined
                }
              >
                <ProductCard
                  distanceKm={distances.get(item.productId) ?? null}
                  initiallyWished={wishedIds.has(item.productId)}
                  item={item}
                />
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </PageContainer>
  );
}
