import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Select } from '@/components/common/Select';

describe('Select', () => {
  it('label과 helper text를 control에 연결한다', () => {
    render(
      <Select helperText="결과 목록의 정렬 기준입니다." label="정렬">
        <option>최신순</option>
      </Select>,
    );

    const select = screen.getByRole('combobox', { name: '정렬' });
    const helper = screen.getByText('결과 목록의 정렬 기준입니다.');

    expect(select).toHaveAccessibleDescription(helper.textContent ?? '');
  });

  it('오류 메시지와 invalid 상태를 함께 제공한다', () => {
    render(
      <Select errorMessage="정렬 기준을 선택해 주세요." label="정렬">
        <option value="">선택</option>
      </Select>,
    );

    expect(screen.getByRole('combobox', { name: '정렬' })).toBeInvalid();
    expect(screen.getByRole('alert')).toHaveTextContent(
      '정렬 기준을 선택해 주세요.',
    );
  });
});
