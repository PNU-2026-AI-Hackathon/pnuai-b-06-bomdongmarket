import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useSpaces } from '@/pages/spaces/hooks/useSpaces';

const getSpacesMock = vi.hoisted(() => vi.fn());

vi.mock('@/services/spaceService', () => ({
  getSpaces: getSpacesMock,
}));

const emptyPage = {
  content: [],
  page: 0,
  size: 12,
  totalElements: 0,
  totalPages: 1,
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((complete) => {
    resolve = complete;
  });
  return { promise, resolve };
}

describe('useSpaces', () => {
  beforeEach(() => {
    getSpacesMock.mockReset();
    getSpacesMock.mockResolvedValue(emptyPage);
  });

  it('빠른 한글 조합 입력이 끝난 뒤 한 번만 검색한다', async () => {
    const { result } = renderHook(() => useSpaces());
    await waitFor(() => expect(getSpacesMock).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(result.current.status).toBe('success'));

    act(() => result.current.setFilters({ ...result.current.filters, keyword: 'ㅅ' }));
    act(() => result.current.setFilters({ ...result.current.filters, keyword: '서' }));
    act(() => result.current.setFilters({ ...result.current.filters, keyword: '서면' }));

    expect(result.current.filters.keyword).toBe('서면');
    expect(getSpacesMock).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(getSpacesMock).toHaveBeenCalledTimes(2), {
      timeout: 1_000,
    });
    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(getSpacesMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ keyword: '서면' }),
    );
  });

  it('이전 검색 응답이 늦게 도착해도 최신 결과를 유지한다', async () => {
    const { result } = renderHook(() => useSpaces());
    await waitFor(() => expect(result.current.status).toBe('success'));

    const older = deferred<typeof emptyPage>();
    const newer = deferred<typeof emptyPage>();
    getSpacesMock
      .mockImplementationOnce(() => older.promise)
      .mockImplementationOnce(() => newer.promise);

    act(() => result.current.setFilters({ ...result.current.filters, keyword: '서' }));
    await waitFor(() => expect(getSpacesMock).toHaveBeenCalledTimes(2), {
      timeout: 1_000,
    });

    act(() => result.current.setFilters({ ...result.current.filters, keyword: '서면' }));
    await waitFor(() => expect(getSpacesMock).toHaveBeenCalledTimes(3), {
      timeout: 1_000,
    });

    await act(async () => {
      newer.resolve({ ...emptyPage, totalElements: 2 });
      await newer.promise;
    });
    expect(result.current.spaces.totalElements).toBe(2);

    await act(async () => {
      older.resolve({ ...emptyPage, totalElements: 1 });
      await older.promise;
    });
    expect(result.current.spaces.totalElements).toBe(2);
  });
});
