import { describe, expect, it } from 'vitest';

import { validateAmounts } from '@/pages/contract/constants/contractAmounts';

// min/step 속성이 브라우저 단계에서 대부분을 막지만, 붙여넣기·모바일 키패드는 그 검사를 지나쳐 옵니다.
// 제출 직전 마지막 관문이라 화면 없이 직접 검증합니다.

const valid = { monthlyRent: '500000', maintenanceFee: '50000', deposit: '3000000' };

describe('validateAmounts', () => {
  it('1 이상의 정수는 통과시킨다', () => {
    expect(validateAmounts(valid)).toEqual({});
    expect(validateAmounts({ ...valid, monthlyRent: '1' })).toEqual({});
  });

  it.each([
    ['0', '0원'],
    ['-1', '음수'],
    ['1.5', '소수'],
    ['', '빈 값'],
    ['abc', '숫자가 아닌 값'],
  ])('%s(%s)는 칸마다 문구를 붙여 거른다', (input) => {
    expect(validateAmounts({ ...valid, deposit: input })).toEqual({
      deposit: '보증금은 1 이상의 정수여야 합니다.',
    });
  });

  it('여러 칸이 함께 잘못되면 모두 알린다', () => {
    expect(validateAmounts({ monthlyRent: '0', maintenanceFee: '-3', deposit: '10' })).toEqual({
      monthlyRent: '월세는 1 이상의 정수여야 합니다.',
      maintenanceFee: '관리비는 1 이상의 정수여야 합니다.',
    });
  });
});
