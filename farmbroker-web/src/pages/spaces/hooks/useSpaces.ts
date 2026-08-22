import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useDebouncedValue } from '@/hooks/useDebouncedValue';
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

const SEARCH_DEBOUNCE_MS = 300;

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
  const requestIdRef = useRef(0);
  const debouncedKeyword = useDebouncedValue(filters.keyword, SEARCH_DEBOUNCE_MS);

  const params = useMemo(
    () => ({
      keyword: debouncedKeyword,
      minArea: filters.minArea ? Number(filters.minArea) : undefined,
      maxRent: filters.maxRent ? Number(filters.maxRent) : undefined,
      sort: filters.sort,
      page: 0,
      size: 12,
    }),
    [debouncedKeyword, filters.maxRent, filters.minArea, filters.sort],
  );

  const load = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setStatus('loading');
    setError(null);

    try {
      const result = await getSpaces(params);
      if (requestId !== requestIdRef.current) return;
      setSpaces(result);
      setStatus('success');
    } catch (caught) {
      if (requestId !== requestIdRef.current) return;
      setError(
        caught instanceof Error ? caught.message : '공간 목록을 불러오지 못했습니다',
      );
      setStatus('error');
    }
  }, [params]);

  useEffect(() => {
    void load();
    return () => {
      requestIdRef.current += 1;
    };
  }, [load]);

  return { filters, setFilters, spaces, status, error, reload: load };
}
