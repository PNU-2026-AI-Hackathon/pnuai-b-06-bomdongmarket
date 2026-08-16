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
  // 지도 반경 검색 중일 때만 채워진다. id → 중심에서의 거리(km).
  distances?: Map<number, number>;
  // 지도 마커를 클릭해 고른 공간의 id. 해당 카드를 강조한다.
  selectedId?: number | null;
  // 마커 클릭 시 해당 카드로 스크롤하기 위해 상위가 각 카드의 DOM 노드를 얻는 콜백.
  onCardRef?: (spaceId: number, el: HTMLLIElement | null) => void;
}

// 공간 목록의 로딩, 에러, 빈 상태까지 한곳에서 처리합니다.
export function SpaceList({
  spaces,
  status,
  error,
  onRetry,
  distances,
  selectedId,
  onCardRef,
}: SpaceListProps) {
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
    <ul className="grid list-none gap-4 p-0 sm:grid-cols-2 xl:grid-cols-3">
      {spaces.map((space) => (
        <li
          key={space.spaceId}
          className={
            selectedId === space.spaceId ? 'rounded-app ring-2 ring-leaf-500' : undefined
          }
          ref={(el) => onCardRef?.(space.spaceId, el)}
        >
          <SpaceCard distanceKm={distances?.get(space.spaceId) ?? null} space={space} />
        </li>
      ))}
    </ul>
  );
}
