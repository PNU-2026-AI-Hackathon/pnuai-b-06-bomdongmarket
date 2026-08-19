import { describe, expect, it } from 'vitest';

import {
  END_DATE_MESSAGE,
  START_DATE_MESSAGE,
  nextDay,
  startDateBounds,
  validatePeriod,
} from '@/pages/contract/constants/contractDates';

// 달력의 min/max가 브라우저 단계에서 대부분을 막지만 직접 입력·붙여넣기는 그 검사를 지나쳐 옵니다.
// 경계값과 월말·연말 넘김은 화면 없이 직접 검증합니다.

// 기준일을 넘겨 오늘 날짜에 흔들리지 않게 합니다(월 인덱스는 0부터라 8월은 7).
const august20 = new Date(2026, 7, 20);

describe('startDateBounds', () => {
  it('오늘을 가운데 둔 ±14일을 돌려준다', () => {
    expect(startDateBounds(august20)).toEqual({ min: '2026-08-06', max: '2026-09-03' });
  });

  it('월말·연말을 넘어가도 달력대로 계산한다', () => {
    expect(startDateBounds(new Date(2026, 11, 25))).toEqual({
      min: '2026-12-11',
      max: '2027-01-08',
    });
    // 2028년은 윤년이라 2월이 29일까지 있습니다.
    expect(startDateBounds(new Date(2028, 1, 20))).toEqual({
      min: '2028-02-06',
      max: '2028-03-05',
    });
  });
});

describe('nextDay', () => {
  it('하루 뒤를 돌려준다', () => {
    expect(nextDay('2026-08-20')).toBe('2026-08-21');
    expect(nextDay('2026-08-31')).toBe('2026-09-01');
    expect(nextDay('2026-12-31')).toBe('2027-01-01');
    expect(nextDay('2028-02-28')).toBe('2028-02-29');
  });
});

describe('validatePeriod', () => {
  it('창 안의 시작일과 그보다 뒤인 종료일은 통과시킨다', () => {
    expect(
      validatePeriod({ startDate: '2026-08-20', endDate: '2027-08-19' }, august20),
    ).toEqual({});
  });

  it('±14일 경계는 포함하고 ±15일부터 거른다', () => {
    for (const startDate of ['2026-08-06', '2026-09-03']) {
      expect(validatePeriod({ startDate, endDate: '2027-08-19' }, august20)).toEqual({});
    }
    for (const startDate of ['2026-08-05', '2026-09-04']) {
      expect(validatePeriod({ startDate, endDate: '2027-08-19' }, august20)).toEqual({
        startDate: START_DATE_MESSAGE,
      });
    }
  });

  it('종료일이 시작일과 같거나 앞서면 거른다', () => {
    expect(
      validatePeriod({ startDate: '2026-08-20', endDate: '2026-08-20' }, august20),
    ).toEqual({ endDate: END_DATE_MESSAGE });
    expect(
      validatePeriod({ startDate: '2026-08-20', endDate: '2026-08-19' }, august20),
    ).toEqual({ endDate: END_DATE_MESSAGE });
  });

  it('둘 다 어긋나면 칸마다 따로 알린다', () => {
    expect(
      validatePeriod({ startDate: '2026-07-01', endDate: '2026-06-01' }, august20),
    ).toEqual({ startDate: START_DATE_MESSAGE, endDate: END_DATE_MESSAGE });
  });

  it('빈 값도 걸러 낸다', () => {
    expect(validatePeriod({ startDate: '', endDate: '' }, august20)).toEqual({
      startDate: START_DATE_MESSAGE,
      endDate: END_DATE_MESSAGE,
    });
  });
});
