import type { SpaceSearchParams } from '@/types/api';

export type SpaceFilterState = Required<Pick<SpaceSearchParams, 'keyword' | 'sort'>> & {
  minArea: string;
  maxRent: string;
};
