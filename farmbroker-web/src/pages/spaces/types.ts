import type { AddressValue } from '@/pages/spaces/components/AddressField';
import type { SpaceCreateInput, SpaceSearchParams } from '@/types/api';

export type SpaceFilterState = Required<Pick<SpaceSearchParams, 'keyword' | 'sort'>> & {
  minArea: string;
  maxRent: string;
};

// 등록 폼과 예측 확인 페이지는 아직 저장되지 않은 입력값을 라우터 state로 주고받습니다.
export interface SpaceCreateLocationState {
  input: SpaceCreateInput;
  // input.address는 도로명과 상세주소를 합친 값(서버 계약)이라 되돌아왔을 때 두 칸으로 다시 나눌 수 없습니다.
  // 합치기 전 원본을 함께 실어 등록 폼이 그대로 복원되게 합니다.
  addressParts?: AddressValue;
}
