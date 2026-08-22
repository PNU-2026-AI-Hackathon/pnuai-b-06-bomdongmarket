// 계약서의 날짜 칸(계약 시작일·종료일) 규칙입니다.
// 시작일은 오늘을 가운데 둔 ±2주 안에서만 고를 수 있고, 종료일은 시작일보다 뒤여야 합니다.
// 백엔드 MatchingService.updateContractTerms의 CONTRACT_START_WINDOW_WEEKS·CONTRACT_INVALID_PERIOD와 같은 제약입니다.
// 프로젝트에 날짜 라이브러리가 없고 날짜는 전부 yyyy-MM-dd 문자열로 오가므로 여기서도 문자열로 다룹니다
// (yyyy-MM-dd는 사전순 비교가 곧 날짜 비교입니다).

export const START_DATE_WINDOW_DAYS = 14;

export const START_DATE_MESSAGE = `계약 시작일은 오늘부터 앞뒤 ${
  START_DATE_WINDOW_DAYS / 7
}주 이내여야 합니다.`;

export const END_DATE_MESSAGE = '계약 종료일은 시작일보다 뒤여야 합니다.';

export type ContractDateField = 'startDate' | 'endDate';

export type ContractPeriodErrors = Partial<Record<ContractDateField, string>>;

// toISOString()은 UTC 기준이라 KST(+9)에서는 하루 밀립니다 — 로컬 연·월·일로 직접 조립합니다.
function toDateValue(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

// Date 산술에 맡기면 월말·연말과 서머타임 넘김을 직접 계산하지 않아도 됩니다.
function shiftDays(value: string, days: number): string {
  const [year, month, day] = value.split('-').map(Number);
  return toDateValue(new Date(year, month - 1, day + days));
}

// 시작일 달력에 걸 하한·상한입니다.
export function startDateBounds(today: Date = new Date()) {
  const base = toDateValue(today);
  return {
    min: shiftDays(base, -START_DATE_WINDOW_DAYS),
    max: shiftDays(base, START_DATE_WINDOW_DAYS),
  };
}

// 종료일 달력에 걸 하한입니다. 종료일은 시작일과 같은 날일 수 없습니다.
export function nextDay(value: string): string {
  return shiftDays(value, 1);
}

// 달력의 min·max는 직접 입력과 붙여넣기를 막지 못해 제출 시점에 한 번 더 검사합니다.
export function validatePeriod(
  values: Record<ContractDateField, string>,
  today: Date = new Date(),
): ContractPeriodErrors {
  const errors: ContractPeriodErrors = {};
  const bounds = startDateBounds(today);

  if (values.startDate < bounds.min || values.startDate > bounds.max) {
    errors.startDate = START_DATE_MESSAGE;
  }
  if (values.endDate <= values.startDate) {
    errors.endDate = END_DATE_MESSAGE;
  }

  return errors;
}
