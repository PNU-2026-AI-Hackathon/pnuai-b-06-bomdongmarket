import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

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
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-soil-500">
            공간
          </p>
          <h1 className="mt-2 text-3xl font-black text-ink-900 sm:text-4xl">
            스마트팜으로 전환 가능한 도심 공간 찾기
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            지역명으로 검색하고 월세를 비교한 뒤 상세 화면에서 AI 작물 추천과 매칭
            신청까지 이어갈 수 있습니다.
          </p>
        </div>
        <Link
          className={buttonStyles({ className: 'w-full sm:w-auto' })}
          to={ROUTES.newSpace}
        >
          <Plus className="h-5 w-5" aria-hidden />
          공간 등록
        </Link>
      </div>

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
