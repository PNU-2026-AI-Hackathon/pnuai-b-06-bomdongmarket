import { Search, Sparkles } from 'lucide-react';
import { useState } from 'react';

import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Input } from '@/components/common/Input';
import { LoadingState } from '@/components/common/LoadingState';
import { PageContainer } from '@/components/layout/PageContainer';
import { RecommendationCard } from '@/pages/farmer/components/RecommendationCard';
import { useFarmerRecommendations } from '@/pages/farmer/hooks/useFarmerRecommendations';

// 도심 농부가 등록된 공간을 탐색하고 상세의 AI 추천으로 이어지는 화면입니다.
export function FarmerPage() {
  const { recommendations, status, error, reload } = useFarmerRecommendations();
  const [keyword, setKeyword] = useState('');
  const filtered = recommendations.filter((item) =>
    `${item.title} ${item.address}`.toLowerCase().includes(keyword.toLowerCase()),
  );

  return (
    <PageContainer>
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-soil-500">
            농부 매칭
          </p>
          <h1 className="mt-2 text-3xl font-black text-ink-900 sm:text-4xl">
            매칭 가능한 공간
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            등록된 공간의 면적과 월세를 비교하고, 상세 화면에서 실제 공간 정보에 기반한 AI
            작물 추천을 확인할 수 있습니다.
          </p>
        </div>
        <div className="rounded-app border border-leaf-100 bg-white p-3 text-sm font-semibold text-leaf-800 shadow-card">
          <Sparkles className="mr-2 inline h-4 w-4 align-[-2px]" aria-hidden />
          상세 화면에서 AI 추천 확인
        </div>
      </div>

      <div className="mt-6 rounded-app border border-leaf-100 bg-white p-4 shadow-card">
        <Input
          aria-label="추천 공간 검색"
          icon={<Search className="h-4 w-4" aria-hidden />}
          placeholder="지역 또는 공간명 검색"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
        />
      </div>

      <div className="mt-6 grid gap-4">
        {status === 'loading' || status === 'idle' ? (
          <LoadingState label="추천 공간을 불러오는 중입니다" />
        ) : null}
        {status === 'error' ? (
          <ErrorState
            message={error ?? '추천 공간을 불러오지 못했습니다'}
            onRetry={reload}
          />
        ) : null}
        {status === 'success' && filtered.length === 0 ? (
          <EmptyState
            title="추천 공간이 없습니다"
            description="검색어를 지우거나 다른 지역 또는 공간명을 입력해보세요."
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
