import { Search, SlidersHorizontal } from 'lucide-react';

import { Input } from '../../../components/common/Input';
import { sortOptions } from '../constants/spaceOptions';
import type { SpaceFilterState } from '../types';

interface SpaceFilterProps {
  filters: SpaceFilterState;
  onChange: (filters: SpaceFilterState) => void;
}

// 검색어, 면적, 월세, 정렬 옵션을 한 줄/스택 레이아웃으로 반응형 배치합니다.
export function SpaceFilter({ filters, onChange }: SpaceFilterProps) {
  return (
    <form className="grid gap-3 rounded-app border border-leaf-100 bg-white p-4 shadow-card md:grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr]">
      <Input
        aria-label="Search spaces"
        icon={<Search className="h-4 w-4" aria-hidden />}
        name="keyword"
        placeholder="Search title or location"
        value={filters.keyword}
        onChange={(event) => onChange({ ...filters, keyword: event.target.value })}
      />
      <Input
        aria-label="Minimum area"
        name="minArea"
        min={0}
        placeholder="Min area"
        type="number"
        value={filters.minArea}
        onChange={(event) => onChange({ ...filters, minArea: event.target.value })}
      />
      <Input
        aria-label="Maximum rent"
        name="maxRent"
        min={0}
        placeholder="Max rent"
        type="number"
        value={filters.maxRent}
        onChange={(event) => onChange({ ...filters, maxRent: event.target.value })}
      />
      <label className="relative block">
        <span className="sr-only">Sort spaces</span>
        <SlidersHorizontal
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          aria-hidden
        />
        <select
          className="min-h-11 w-full rounded-app border border-leaf-100 bg-white px-10 text-sm font-medium text-ink-700 hover:border-leaf-300 focus:border-leaf-500 focus:outline-none focus:ring-2 focus:ring-leaf-200"
          value={filters.sort}
          onChange={(event) =>
            onChange({
              ...filters,
              sort: event.target.value as SpaceFilterState['sort'],
            })
          }
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </form>
  );
}
