import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { getMarketItems } from '@/services/marketService';
import type { MarketItem } from '@/types/api';
import type { AsyncStatus } from '@/types/common';
import type { MarketCategory } from '@/pages/market/types';

const SEARCH_DEBOUNCE_MS = 300;

// 마켓 검색어와 카테고리 필터를 서비스 호출과 연결합니다.
export function useMarketItems() {
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState<MarketCategory>('전체');
  const [items, setItems] = useState<MarketItem[]>([]);
  const [status, setStatus] = useState<AsyncStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);
  const debouncedKeyword = useDebouncedValue(keyword, SEARCH_DEBOUNCE_MS);

  const params = useMemo(
    () => ({ keyword: debouncedKeyword, category }),
    [category, debouncedKeyword],
  );

  const load = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setStatus('loading');
    setError(null);

    try {
      const result = await getMarketItems(params);
      if (requestId !== requestIdRef.current) return;
      setItems(result);
      setStatus('success');
    } catch (caught) {
      if (requestId !== requestIdRef.current) return;
      setError(
        caught instanceof Error ? caught.message : '마켓 상품을 불러오지 못했습니다',
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

  return {
    keyword,
    setKeyword,
    category,
    setCategory,
    items,
    status,
    error,
    reload: load,
  };
}
