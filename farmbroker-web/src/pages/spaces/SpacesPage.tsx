import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

import { PageHeader } from '@/components/common/PageHeader';
import { buttonStyles } from '@/components/common/buttonStyles';
import { PageContainer } from '@/components/layout/PageContainer';
import { ROUTES } from '@/constants/routes';
import { SpaceFilter } from '@/pages/spaces/components/SpaceFilter';
import { SpaceList } from '@/pages/spaces/components/SpaceList';
import { useSpaces } from '@/pages/spaces/hooks/useSpaces';

// 공개 공간 탐색 화면입니다. API 명세의 검색/필터/정렬 조건을 mock 서비스와 연결합니다.
export function SpacesPage() {
  const { filters, setFilters, spaces, status, error, reload } = useSpaces();

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
        description="지역명, 면적, 월세를 비교하고 상세 화면에서 AI 작물 추천과 공간 매칭 신청을 진행할 수 있습니다."
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
    </PageContainer>
  );
}
