// 공간 등록 폼의 숫자 입력 제약. 백엔드 SpaceCreateRequest의 검증값과 같은 값을 유지합니다.
// 면적·월세는 음수가 의미 없지만, 층수는 지하(-1, -2 …)가 정상값이라 음수를 막지 않고 범위만 제한합니다.
export const AREA_MAX = 99999.99;
export const RENT_MIN = 0;
export const FLOOR_MIN = -10;
export const FLOOR_MAX = 200;

export const NUMBER_FIELD_MESSAGES = {
  areaPositive: '면적은 0보다 커야 합니다.',
  areaMax: `면적은 ${AREA_MAX.toLocaleString('ko-KR')}㎡ 이하여야 합니다.`,
  rentMin: '월세는 0 이상이어야 합니다.',
  floorRange: `층수는 ${FLOOR_MIN}층(지하) ~ ${FLOOR_MAX}층 사이여야 합니다.`,
  floorZero: '올바른 숫자를 입력해주세요.',
} as const;

export interface SpaceNumberInput {
  area: number;
  monthlyRent: number;
  floor: number;
}

export type SpaceNumberErrors = Partial<Record<keyof SpaceNumberInput, string>>;

// 붙여넣기·모바일 키패드처럼 키 입력 차단으로는 막을 수 없는 경로까지 제출 시점에 한 번 더 검사합니다.
export function validateSpaceNumbers({
  area,
  monthlyRent,
  floor,
}: SpaceNumberInput): SpaceNumberErrors {
  const errors: SpaceNumberErrors = {};

  if (!Number.isFinite(area) || area <= 0) {
    errors.area = NUMBER_FIELD_MESSAGES.areaPositive;
  } else if (area > AREA_MAX) {
    errors.area = NUMBER_FIELD_MESSAGES.areaMax;
  }

  if (!Number.isFinite(monthlyRent) || monthlyRent < RENT_MIN) {
    errors.monthlyRent = NUMBER_FIELD_MESSAGES.rentMin;
  }

  if (!Number.isFinite(floor) || floor < FLOOR_MIN || floor > FLOOR_MAX) {
    errors.floor = NUMBER_FIELD_MESSAGES.floorRange;
  } else if (floor === 0) {
    // 건물에 0층은 없다. min/max는 연속 범위만 표현할 수 있어(면적처럼 min으로 막을 수 없다)
    // 입력 자체는 두고 제출 시점에 여기서 걸러낸다.
    errors.floor = NUMBER_FIELD_MESSAGES.floorZero;
  }

  return errors;
}
