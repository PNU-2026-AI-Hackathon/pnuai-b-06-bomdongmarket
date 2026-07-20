import { ArrowLeft } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

import { ErrorState } from '@/components/common/ErrorState';
import { LoadingState } from '@/components/common/LoadingState';
import { PageContainer } from '@/components/layout/PageContainer';
import { ROUTES } from '@/constants/routes';
import { ProfitEstimateCard } from '@/pages/space-detail/components/ProfitEstimateCard';
import { SpaceImageGallery } from '@/pages/space-detail/components/SpaceImageGallery';
import { SpaceInfoPanel } from '@/pages/space-detail/components/SpaceInfoPanel';
import { useSpaceDetail } from '@/pages/space-detail/hooks/useSpaceDetail';

// 공간 상세 조회 API와 AI 추천 API를 함께 시연하는 상세 화면입니다.
export function SpaceDetailPage() {
  const params = useParams();
  const spaceId = Number(params.spaceId ?? 1);
  const {
    space,
    recommendation,
    status,
    recommendationStatus,
    matchingStatus,
    matchingError,
    error,
    reload,
    loadRecommendation,
    sendMatchingRequest,
  } = useSpaceDetail(spaceId);

  return (
    <PageContainer>
      <Link
        className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-leaf-700"
        to={ROUTES.spaces}
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        공간 목록으로 돌아가기
      </Link>

      {status === 'loading' || status === 'idle' ? (
        <LoadingState label="공간 상세 정보를 불러오는 중입니다" />
      ) : null}

      {status === 'error' ? (
        <ErrorState
          message={error ?? '공간 상세 정보를 불러오지 못했습니다'}
          onRetry={reload}
        />
      ) : null}

      {space ? (
        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <SpaceImageGallery imageUrls={space.imageUrls} title={space.title} />
          <div className="grid gap-5">
            <SpaceInfoPanel space={space} />
            <ProfitEstimateCard
              matchingError={matchingError}
              matchingStatus={matchingStatus}
              onApply={sendMatchingRequest}
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
