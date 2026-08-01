import { useCallback, useEffect, useMemo, useState } from 'react';

import { getSpaces } from '@/services/spaceService';
import type { PageResponse, SpaceSummary } from '@/types/api';
import type { AsyncStatus } from '@/types/common';
import type { SpaceFilterState } from '@/pages/spaces/types';

const initialPage: PageResponse<SpaceSummary> = {
  content: [],
  page: 0,
  size: 10,
  totalElements: 0,
  totalPages: 1,
};

// 공간 목록 페이지의 필터 상태와 mock/API 호출을 분리해 UI 컴포넌트를 가볍게 유지합니다.
export function useSpaces(initialFilters?: Partial<SpaceFilterState>) {
  const [filters, setFilters] = useState<SpaceFilterState>({
    keyword: '',
    minArea: '',
    maxRent: '',
    sort: 'latest',
    ...initialFilters,
  });
  const [spaces, setSpaces] = useState<PageResponse<SpaceSummary>>(initialPage);
  const [status, setStatus] = useState<AsyncStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const params = useMemo(
    () => ({
      keyword: filters.keyword,
      minArea: filters.minArea ? Number(filters.minArea) : undefined,
      maxRent: filters.maxRent ? Number(filters.maxRent) : undefined,
      sort: filters.sort,
      page: 0,
      size: 12,
    }),
    [filters],
  );

  const load = useCallback(async () => {
    setStatus('loading');
    setError(null);

    try {
      const result = await getSpaces(params);
      setSpaces(result);
      setStatus('success');
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : '공간 목록을 불러오지 못했습니다',
      );
      setStatus('error');
    }
  }, [params]);

  useEffect(() => {
    void load();
  }, [load]);

  return { filters, setFilters, spaces, status, error, reload: load };
}
