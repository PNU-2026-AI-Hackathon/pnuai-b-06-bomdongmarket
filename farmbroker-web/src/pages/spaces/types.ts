import type { SpaceCreateInput, SpaceSearchParams } from '@/types/api';

export type SpaceFilterState = Required<Pick<SpaceSearchParams, 'keyword' | 'sort'>> & {
  minArea: string;
  maxRent: string;
};

// 등록 폼과 예측 확인 페이지는 아직 저장되지 않은 입력값을 라우터 state로 주고받습니다.
export interface SpaceCreateLocationState {
  input: SpaceCreateInput;
}
