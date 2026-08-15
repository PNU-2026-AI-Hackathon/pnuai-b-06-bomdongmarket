import { describe, expect, it } from 'vitest';

import {
  composeUnit,
  parseUnit,
  unitPriceHint,
} from '@/pages/market/constants/saleUnits';

describe('composeUnit', () => {
  it('수량과 단위를 백엔드 unit 문자열로 합친다', () => {
    expect(composeUnit('200', 'g')).toBe('200g');
    expect(composeUnit('1', 'kg')).toBe('1kg');
    expect(composeUnit(' 10 ', '개')).toBe('10개');
  });

  it('수량이 비면 빈 문자열을 돌려준다 — 필수 검증에 걸리게 한다', () => {
    expect(composeUnit('', 'g')).toBe('');
  });
});

describe('parseUnit', () => {
  it('저장된 unit 문자열을 수량과 단위로 되돌린다', () => {
    expect(parseUnit('200g')).toEqual({ amount: '200', unit: 'g' });
    expect(parseUnit('1.5kg')).toEqual({ amount: '1.5', unit: 'kg' });
  });

  // 양을 알 수 없는 옛 자유 입력값을 그대로 되살리면 잘못된 수량이 만들어진다.
  it('수량이 없거나 모르는 단위면 null을 돌려준다', () => {
    expect(parseUnit('팩')).toBeNull();
    expect(parseUnit('한 봉지')).toBeNull();
    expect(parseUnit('200박스')).toBeNull();
    expect(parseUnit(null)).toBeNull();
  });
});

describe('unitPriceHint', () => {
  it('무게는 100g당 단가로 환산한다', () => {
    expect(unitPriceHint('4300', '200', 'g')).toBe('100g당 약 2,150원');
    expect(unitPriceHint('12000', '1', 'kg')).toBe('100g당 약 1,200원');
  });

  it('낱개·묶음은 1단위당 단가로 환산한다', () => {
    expect(unitPriceHint('5000', '10', '개')).toBe('1개당 약 500원');
    expect(unitPriceHint('9000', '3', '단')).toBe('1단당 약 3,000원');
  });

  // "1개에 1개 값"은 아무 정보도 주지 않는다.
  it('수량이 1인 낱개는 환산을 생략한다', () => {
    expect(unitPriceHint('5000', '1', '개')).toBeNull();
  });

  it('값이 비었거나 0 이하면 표시하지 않는다', () => {
    expect(unitPriceHint('', '200', 'g')).toBeNull();
    expect(unitPriceHint('4300', '0', 'g')).toBeNull();
    expect(unitPriceHint('4300', '200', '박스')).toBeNull();
  });
});
