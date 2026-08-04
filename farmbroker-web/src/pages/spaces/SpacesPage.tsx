import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSearchParams } from 'react-router-dom';

import { PageHeader } from '@/components/common/PageHeader';
import { buttonStyles } from '@/components/common/buttonStyles';
import { PageContainer } from '@/components/layout/PageContainer';
import { ROUTES } from '@/constants/routes';
import { SpaceFilter } from '@/pages/spaces/components/SpaceFilter';
import { SpaceList } from '@/pages/spaces/components/SpaceList';
import { SpaceMatchingPanel } from '@/pages/spaces/components/SpaceMatchingPanel';
import { useSpaces } from '@/pages/spaces/hooks/useSpaces';

// 공개 공간 탐색 화면입니다. API 명세의 검색/필터/정렬 조건을 mock 서비스와 연결합니다.
export function SpacesPage() {
  const { filters, setFilters, spaces, status, error, reload } = useSpaces();
  const [searchParams] = useSearchParams();
  const requestedSpaceId = Number(searchParams.get('matchSpaceId'));

  return (
    <PageContainer>
      <PageHeader
        action={
          <Link
            className={buttonStyles({ className: 'w-full sm:w-auto' })}
            to={ROUTES.newSpace}
          >
            <Plus className="h-5 w-5" aria-hidden />
            공간 등록
          </Link>
        }
        description="지역명, 면적, 월세를 비교하고 AI 작물 추천을 확인한 뒤 이 화면에서 공간 매칭을 신청할 수 있습니다."
        eyebrow="공간"
        title="스마트팜으로 전환 가능한 도심 공간 찾기"
      />

      <div className="mt-6">
        <SpaceFilter filters={filters} onChange={setFilters} />
      </div>

      <div className="mt-6">
        <SpaceList
          error={error}
          onRetry={reload}
          spaces={spaces.content}
          status={status}
        />
      </div>

      <div className="mt-8">
        <SpaceMatchingPanel
          initialSpaceId={Number.isFinite(requestedSpaceId) ? requestedSpaceId : null}
          spaces={spaces.content}
        />
      </div>
    </PageContainer>
  );
}
