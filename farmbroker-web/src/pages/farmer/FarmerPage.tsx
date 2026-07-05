import { Filter, MapPinned, Search } from 'lucide-react';
import { useState } from 'react';

import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';
import { Input } from '../../components/common/Input';
import { LoadingState } from '../../components/common/LoadingState';
import { PageContainer } from '../../components/layout/PageContainer';
import { farmerFilterChips } from './constants/farmerContent';
import { RecommendationCard } from './components/RecommendationCard';
import { useFarmerRecommendations } from './hooks/useFarmerRecommendations';

// 도심 농부가 추천 공간을 탐색하고 매칭 상세로 이어지는 화면입니다.
export function FarmerPage() {
  const { recommendations, status, error, reload } = useFarmerRecommendations();
  const [keyword, setKeyword] = useState('');
  const [activeFilter, setActiveFilter] = useState('Area');

  const filtered = recommendations.filter((item) =>
    `${item.title} ${item.address} ${item.recommendedCrop}`
      .toLowerCase()
      .includes(keyword.toLowerCase()),
  );

  return (
    <PageContainer>
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-soil-500">
            Farmer Matching
          </p>
          <h1 className="mt-2 text-3xl font-black text-ink-900 sm:text-4xl">
            Recommended Spaces
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            Compare matching score, expected profit, crop fit, and rent before sending a
            request.
          </p>
        </div>
        <div className="rounded-app border border-leaf-100 bg-white p-3 text-sm font-semibold text-leaf-800 shadow-card">
          <MapPinned className="mr-2 inline h-4 w-4 align-[-2px]" aria-hidden />
          Busan smart-farm map preview
        </div>
      </div>

      <div className="mt-6 grid gap-3 rounded-app border border-leaf-100 bg-white p-4 shadow-card lg:grid-cols-[1fr_auto]">
        <Input
          aria-label="Search recommended spaces"
          icon={<Search className="h-4 w-4" aria-hidden />}
          placeholder="Search crop, neighborhood, or space"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
        />
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" aria-hidden />
          {farmerFilterChips.map((chip) => (
            <button
              key={chip}
              className={`min-h-10 rounded-full px-3 text-sm font-bold transition ${
                activeFilter === chip
                  ? 'bg-leaf-700 text-white'
                  : 'bg-leaf-50 text-leaf-800 hover:bg-leaf-100'
              }`}
              onClick={() => setActiveFilter(chip)}
              type="button"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-4">
        {status === 'loading' || status === 'idle' ? (
          <LoadingState label="Loading recommended spaces" />
        ) : null}
        {status === 'error' ? (
          <ErrorState
            message={error ?? 'Could not load recommendations'}
            onRetry={reload}
          />
        ) : null}
        {status === 'success' && filtered.length === 0 ? (
          <EmptyState
            title="No recommended spaces"
            description="Try removing the keyword filter or switch the ranking chip."
          />
        ) : null}
        {status === 'success'
          ? filtered.map((recommendation) => (
              <RecommendationCard
                key={recommendation.spaceId}
                recommendation={recommendation}
              />
            ))
          : null}
      </div>
    </PageContainer>
  );
}
