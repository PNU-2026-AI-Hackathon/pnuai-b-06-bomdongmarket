import { describe, expect, it } from 'vitest';

import { validateSpaceNumbers } from '@/pages/spaces/constants/spaceNumberLimits';

// 브라우저 min/max 제약이 1차로 막지만, 붙여넣기·모바일 키패드·비정상 값까지
// 확실히 걸러내는 제출 시점 백스톱이다. 백엔드 SpaceCreateRequest와 같은 규칙을 유지한다.
describe('validateSpaceNumbers', () => {
  const valid = { area: 66, monthlyRent: 500000, floor: 2 };

  it('정상 값은 통과시킨다', () => {
    expect(validateSpaceNumbers(valid)).toEqual({});
  });

  it('면적과 월세의 음수를 거른다', () => {
    expect(validateSpaceNumbers({ ...valid, area: -5 }).area).toBe(
      '면적은 0보다 커야 합니다.',
    );
    expect(validateSpaceNumbers({ ...valid, monthlyRent: -1 }).monthlyRent).toBe(
      '월세는 0 이상이어야 합니다.',
    );
  });

  it('면적 0은 막고 월세 0은 허용한다', () => {
    expect(validateSpaceNumbers({ ...valid, area: 0 }).area).toBeDefined();
    // 무상 제공(월세 0원)은 정상 입력이다.
    expect(validateSpaceNumbers({ ...valid, monthlyRent: 0 })).toEqual({});
  });

  // 지하 공간은 층수가 음수다(mock의 '서면 지하 재배 공간'이 -1).
  it('층수의 음수는 지하로 보고 허용한다', () => {
    expect(validateSpaceNumbers({ ...valid, floor: -1 })).toEqual({});
    expect(validateSpaceNumbers({ ...valid, floor: -10 })).toEqual({});
  });

  // 건물에 0층은 없다. 입력은 막지 않고 제출 시점에 이 검증이 걸러낸다.
  it('층수 0을 거른다', () => {
    expect(validateSpaceNumbers({ ...valid, floor: 0 }).floor).toBe(
      '올바른 숫자를 입력해주세요.',
    );
  });

  it('상식을 벗어난 층수는 거른다', () => {
    expect(validateSpaceNumbers({ ...valid, floor: -11 }).floor).toBeDefined();
    expect(validateSpaceNumbers({ ...valid, floor: 201 }).floor).toBeDefined();
  });

  // area 컬럼이 precision 7 / scale 2라 이 값을 넘기면 DB 저장 단계에서 터진다.
  it('DB 컬럼 정밀도를 넘는 면적을 거른다', () => {
    expect(validateSpaceNumbers({ ...valid, area: 100000 }).area).toBeDefined();
  });

  it('빈 값이 숫자로 변환돼 들어오는 경우를 거른다', () => {
    expect(validateSpaceNumbers({ ...valid, area: Number('') }).area).toBeDefined();
    expect(validateSpaceNumbers({ ...valid, floor: Number('abc') }).floor).toBeDefined();
  });
});
