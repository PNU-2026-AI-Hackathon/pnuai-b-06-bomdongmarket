import { useCallback, useEffect, useMemo, useState } from 'react';

import { getMarketItems } from '../../../services/marketService';
import type { MarketItem } from '../../../types/api';
import type { AsyncStatus } from '../../../types/common';
import type { MarketCategory } from '../types';

// 마켓 검색어와 카테고리 필터를 서비스 호출과 연결합니다.
export function useMarketItems() {
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState<MarketCategory>('All');
  const [items, setItems] = useState<MarketItem[]>([]);
  const [status, setStatus] = useState<AsyncStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const params = useMemo(() => ({ keyword, category }), [keyword, category]);

  const load = useCallback(async () => {
    setStatus('loading');
    setError(null);

    try {
      const result = await getMarketItems(params);
      setItems(result);
      setStatus('success');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to load market');
      setStatus('error');
    }
  }, [params]);

  useEffect(() => {
    void load();
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
