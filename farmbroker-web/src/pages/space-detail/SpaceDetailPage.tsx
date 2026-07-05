import { ArrowLeft } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

import { ErrorState } from '../../components/common/ErrorState';
import { LoadingState } from '../../components/common/LoadingState';
import { PageContainer } from '../../components/layout/PageContainer';
import { ROUTES } from '../../constants/routes';
import { ProfitEstimateCard } from './components/ProfitEstimateCard';
import { SpaceImageGallery } from './components/SpaceImageGallery';
import { SpaceInfoPanel } from './components/SpaceInfoPanel';
import { useSpaceDetail } from './hooks/useSpaceDetail';

// 공간 상세 조회 API와 AI 추천 API를 함께 시연하는 상세 화면입니다.
export function SpaceDetailPage() {
  const params = useParams();
  const spaceId = Number(params.spaceId ?? 1);
  const {
    space,
    recommendation,
    status,
    recommendationStatus,
    error,
    reload,
    loadRecommendation,
  } = useSpaceDetail(spaceId);

  return (
    <PageContainer>
      <Link
        className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-leaf-700"
        to={ROUTES.spaces}
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to spaces
      </Link>

      {status === 'loading' || status === 'idle' ? (
        <LoadingState label="Loading space detail" />
      ) : null}

      {status === 'error' ? (
        <ErrorState message={error ?? 'Could not load this space'} onRetry={reload} />
      ) : null}

      {space ? (
        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <SpaceImageGallery imageUrls={space.imageUrls} title={space.title} />
          <div className="grid gap-5">
            <SpaceInfoPanel space={space} />
            <ProfitEstimateCard
              onRun={loadRecommendation}
              recommendation={recommendation}
              status={recommendationStatus}
            />
          </div>
        </div>
      ) : null}
    </PageContainer>
  );
}
