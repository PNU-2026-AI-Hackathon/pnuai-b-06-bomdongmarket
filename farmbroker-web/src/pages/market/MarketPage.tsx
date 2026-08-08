import { MapPin, Search, Store } from 'lucide-react';
import { Link } from 'react-router-dom';

import { useAuth } from '@/auth/authContext';
import { hasRole } from '@/auth/roles';
import { buttonStyles } from '@/components/common/buttonStyles';
import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Input } from '@/components/common/Input';
import { LoadingState } from '@/components/common/LoadingState';
import { PageHeader } from '@/components/common/PageHeader';
import { PageContainer } from '@/components/layout/PageContainer';
import { ProductCard } from '@/pages/market/components/ProductCard';
import { marketCategories } from '@/pages/market/constants/marketOptions';
import { useMarketItems } from '@/pages/market/hooks/useMarketItems';
import type { MarketCategory } from '@/pages/market/types';
import { ROUTES } from '@/constants/routes';

// 소비자가 근처 스마트팜 상품을 검색하고 담을 수 있는 로컬 마켓 화면입니다.
export function MarketPage() {
  const { keyword, setKeyword, category, setCategory, items, status, error, reload } =
    useMarketItems();
  const { user } = useAuth();
  // 상품 등록은 FARMER만 가능하므로(#56) 판매 진입점도 도심 농부에게만 보입니다.
  // 소비자에게 눌러 봐야 403이 나는 버튼을 보여 주지 않기 위함입니다.
  const isFarmer = hasRole(user, 'FARMER');

  return (
    <PageContainer>
      <PageHeader
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Card className="text-sm font-semibold text-action" padding="sm">
              <MapPin className="mr-2 inline h-4 w-4 align-[-2px]" aria-hidden />
              부산 반경 8km 이내
            </Card>
            {isFarmer ? (
              <Link
                className={buttonStyles({ size: 'sm', variant: 'outline' })}
                to={ROUTES.myProducts}
              >
                <Store className="h-4 w-4" aria-hidden />
                판매 관리
              </Link>
            ) : null}
          </div>
        }
        actionBreakpoint="lg"
        description="수확일, 푸드 마일리지, 생산 이력, 바로 담기 기능으로 로컬 농산물을 비교해보세요."
        eyebrow="로컬 마켓"
        title="가까운 스마트팜에서 온 신선한 농산물"
      />

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
        {status === 'success' && items.length === 0 ? (
          <EmptyState
            title="검색된 상품이 없습니다"
            description="다른 카테고리를 선택하거나 가까운 농장을 검색해보세요."
          />
        ) : null}
        {status === 'success' && items.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <ProductCard item={item} key={item.productId} />
            ))}
          </div>
        ) : null}
      </div>
    </PageContainer>
  );
}
