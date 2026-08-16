import type { KeyboardEvent } from 'react';

// 계약서의 금액 칸(월세·관리비·보증금)은 모두 "1 이상의 정수" 하나의 규칙을 따릅니다.
// 백엔드 ContractTermsRequest의 Integer + @Min(1)과 같은 제약입니다.

export const AMOUNT_MIN = 1;

export type ContractAmountField = 'monthlyRent' | 'maintenanceFee' | 'deposit';

// 조사가 달라 한 문장을 조립하지 않고 칸마다 적어 둡니다(월세는 / 관리비는 / 보증금은).
export const AMOUNT_MESSAGES: Record<ContractAmountField, string> = {
  monthlyRent: `월세는 ${AMOUNT_MIN} 이상의 정수여야 합니다.`,
  maintenanceFee: `관리비는 ${AMOUNT_MIN} 이상의 정수여야 합니다.`,
  deposit: `보증금은 ${AMOUNT_MIN} 이상의 정수여야 합니다.`,
};

export type ContractAmountErrors = Partial<Record<ContractAmountField, string>>;

// 금액 칸의 키 입력을 걸러 냅니다. type="number"는 음수 부호·소수점·지수 표기를 모두 허용하기 때문입니다.
export function blockNonPositiveIntegerKeys(event: KeyboardEvent<HTMLInputElement>) {
  if (['-', '+', 'e', 'E', '.', ','].includes(event.key)) {
    event.preventDefault();
  }
}

// 키 입력 차단으로는 붙여넣기와 모바일 키패드를 막을 수 없어 제출 시점에 한 번 더 검사합니다.
export function validateAmounts(
  values: Record<ContractAmountField, string>,
): ContractAmountErrors {
  const errors: ContractAmountErrors = {};

  for (const field of Object.keys(AMOUNT_MESSAGES) as ContractAmountField[]) {
    const amount = Number(values[field]);
    if (!Number.isInteger(amount) || amount < AMOUNT_MIN) {
      errors[field] = AMOUNT_MESSAGES[field];
    }
  }

  return errors;
}
