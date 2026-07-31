import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingState } from '@/components/common/LoadingState';
import type { SpaceSummary } from '@/types/api';
import type { AsyncStatus } from '@/types/common';
import { SpaceCard } from '@/pages/spaces/components/SpaceCard';

interface SpaceListProps {
  spaces: SpaceSummary[];
  status: AsyncStatus;
  error: string | null;
  onRetry: () => void;
}

// 공간 목록의 로딩, 에러, 빈 상태까지 한곳에서 처리합니다.
export function SpaceList({ spaces, status, error, onRetry }: SpaceListProps) {
  if (status === 'loading' || status === 'idle') {
    return <LoadingState label="등록된 공간을 불러오는 중입니다" />;
  }

  if (status === 'error') {
    return (
      <ErrorState
        message={error ?? '공간 목록을 불러오지 못했습니다'}
        onRetry={onRetry}
      />
    );
  }

  if (spaces.length === 0) {
    return (
      <EmptyState
        title="검색된 공간이 없습니다"
        description="다른 키워드를 입력하거나 월세/면적 필터를 조정해보세요."
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {spaces.map((space) => (
        <SpaceCard key={space.spaceId} space={space} />
      ))}
    </div>
  );
}
