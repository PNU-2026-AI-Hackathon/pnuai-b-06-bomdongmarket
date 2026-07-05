import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

import { buttonStyles } from '../../components/common/buttonStyles';
import { PageContainer } from '../../components/layout/PageContainer';
import { ROUTES } from '../../constants/routes';
import { SpaceFilter } from './components/SpaceFilter';
import { SpaceList } from './components/SpaceList';
import { useSpaces } from './hooks/useSpaces';

// 공개 공간 탐색 화면입니다. API 명세의 검색/필터/정렬 조건을 mock 서비스와 연결합니다.
export function SpacesPage() {
  const { filters, setFilters, spaces, status, error, reload } = useSpaces();

  return (
    <PageContainer>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-soil-500">
            Spaces
          </p>
          <h1 className="mt-2 text-3xl font-black text-ink-900 sm:text-4xl">
            Find smart-farm-ready urban spaces
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            Search by location, compare monthly rent, and open a detail page to run AI
            crop recommendations or send matching requests.
          </p>
        </div>
        <Link
          className={buttonStyles({ className: 'w-full sm:w-auto' })}
          to={ROUTES.newSpace}
        >
          <Plus className="h-5 w-5" aria-hidden />
          Register Space
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
