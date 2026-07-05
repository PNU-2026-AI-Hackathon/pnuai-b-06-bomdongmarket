import { MapPin, Search } from 'lucide-react';

import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';
import { Input } from '../../components/common/Input';
import { LoadingState } from '../../components/common/LoadingState';
import { PageContainer } from '../../components/layout/PageContainer';
import { ProductCard } from './components/ProductCard';
import { marketCategories } from './constants/marketOptions';
import { useMarketItems } from './hooks/useMarketItems';
import type { MarketCategory } from './types';

// 소비자가 근처 스마트팜 상품을 검색하고 담을 수 있는 로컬 마켓 화면입니다.
export function MarketPage() {
  const { keyword, setKeyword, category, setCategory, items, status, error, reload } =
    useMarketItems();

  return (
    <PageContainer>
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-soil-500">
            Local Market
          </p>
          <h1 className="mt-2 text-3xl font-black text-ink-900 sm:text-4xl">
            Fresh produce from nearby smart farms
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            Browse crops with harvest dates, food mileage, producer history, and direct
            purchase actions.
          </p>
        </div>
        <div className="rounded-app border border-leaf-100 bg-white p-3 text-sm font-semibold text-leaf-800 shadow-card">
          <MapPin className="mr-2 inline h-4 w-4 align-[-2px]" aria-hidden />
          Within 8 km of Busan
        </div>
      </div>

      <div className="mt-6 grid gap-3 rounded-app border border-leaf-100 bg-white p-4 shadow-card lg:grid-cols-[1fr_auto]">
        <Input
          aria-label="Search products"
          icon={<Search className="h-4 w-4" aria-hidden />}
          placeholder="Search produce or farm"
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
          <LoadingState label="Loading local products" />
        ) : null}
        {status === 'error' ? (
          <ErrorState message={error ?? 'Could not load market'} onRetry={reload} />
        ) : null}
        {status === 'success' && items.length === 0 ? (
          <EmptyState
            title="No products found"
            description="Try another category or search for a nearby farm."
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
