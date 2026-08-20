import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useMarketItems } from '@/pages/market/hooks/useMarketItems';

const getMarketItemsMock = vi.hoisted(() => vi.fn());

vi.mock('@/services/marketService', () => ({
  getMarketItems: getMarketItemsMock,
}));

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((complete) => {
    resolve = complete;
  });
  return { promise, resolve };
}

describe('useMarketItems', () => {
  beforeEach(() => {
    getMarketItemsMock.mockReset();
    getMarketItemsMock.mockResolvedValue([]);
  });

  it('빠른 한글 조합 입력이 끝난 뒤 한 번만 검색한다', async () => {
    const { result } = renderHook(() => useMarketItems());
    await waitFor(() => expect(getMarketItemsMock).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(result.current.status).toBe('success'));

    act(() => result.current.setKeyword('ㅂ'));
    act(() => result.current.setKeyword('배'));
    act(() => result.current.setKeyword('배추'));

    expect(result.current.keyword).toBe('배추');
    expect(getMarketItemsMock).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(getMarketItemsMock).toHaveBeenCalledTimes(2), {
      timeout: 1_000,
    });
    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(getMarketItemsMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ keyword: '배추' }),
    );
  });

  it('이전 검색 응답이 늦게 도착해도 최신 결과를 유지한다', async () => {
    const { result } = renderHook(() => useMarketItems());
    await waitFor(() => expect(result.current.status).toBe('success'));

    const olderItems: never[] = [];
    const newerItems: never[] = [];
    const older = deferred<never[]>();
    const newer = deferred<never[]>();
    getMarketItemsMock
      .mockImplementationOnce(() => older.promise)
      .mockImplementationOnce(() => newer.promise);

    act(() => result.current.setKeyword('배'));
    await waitFor(() => expect(getMarketItemsMock).toHaveBeenCalledTimes(2), {
      timeout: 1_000,
    });

    act(() => result.current.setKeyword('배추'));
    await waitFor(() => expect(getMarketItemsMock).toHaveBeenCalledTimes(3), {
      timeout: 1_000,
    });

    await act(async () => {
      newer.resolve(newerItems);
      await newer.promise;
    });
    expect(result.current.items).toBe(newerItems);

    await act(async () => {
      older.resolve(olderItems);
      await older.promise;
    });
    expect(result.current.items).toBe(newerItems);
  });
});
