import { EmptyState } from '../../../components/common/EmptyState';
import { ErrorState } from '../../../components/common/ErrorState';
import { LoadingState } from '../../../components/common/LoadingState';
import type { SpaceSummary } from '../../../types/api';
import type { AsyncStatus } from '../../../types/common';
import { SpaceCard } from './SpaceCard';

interface SpaceListProps {
  spaces: SpaceSummary[];
  status: AsyncStatus;
  error: string | null;
  onRetry: () => void;
}

// 공간 목록의 로딩, 에러, 빈 상태까지 한곳에서 처리합니다.
export function SpaceList({ spaces, status, error, onRetry }: SpaceListProps) {
  if (status === 'loading' || status === 'idle') {
    return <LoadingState label="Loading available spaces" />;
  }

  if (status === 'error') {
    return <ErrorState message={error ?? 'Could not load spaces'} onRetry={onRetry} />;
  }

  if (spaces.length === 0) {
    return (
      <EmptyState
        title="No spaces found"
        description="Try a different keyword, lower rent cap, or remove the area filter."
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
