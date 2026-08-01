import { MapPin, Search } from 'lucide-react';

import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Input } from '@/components/common/Input';
import { LoadingState } from '@/components/common/LoadingState';
import { PageContainer } from '@/components/layout/PageContainer';
import { ProductCard } from '@/pages/market/components/ProductCard';
import { marketCategories } from '@/pages/market/constants/marketOptions';
import { useMarketItems } from '@/pages/market/hooks/useMarketItems';
import type { MarketCategory } from '@/pages/market/types';

// 소비자가 근처 스마트팜 상품을 검색하고 담을 수 있는 로컬 마켓 화면입니다.
export function MarketPage() {
  const { keyword, setKeyword, category, setCategory, items, status, error, reload } =
    useMarketItems();

  return (
    <PageContainer>
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-soil-500">
            로컬 마켓
          </p>
          <h1 className="mt-2 text-3xl font-black text-ink-900 sm:text-4xl">
            가까운 스마트팜에서 온 신선한 농산물
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            수확일, 푸드 마일리지, 생산 이력, 바로 담기 기능으로 로컬 농산물을
            비교해보세요.
          </p>
        </div>
        <div className="rounded-app border border-leaf-100 bg-white p-3 text-sm font-semibold text-leaf-800 shadow-card">
          <MapPin className="mr-2 inline h-4 w-4 align-[-2px]" aria-hidden />
          부산 반경 8km 이내
        </div>
      </div>

      <div className="mt-6 grid gap-3 rounded-app border border-leaf-100 bg-white p-4 shadow-card lg:grid-cols-[1fr_auto]">
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
              className={`min-h-10 rounded-full px-3 text-sm font-bold transition ${
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
      </div>

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
