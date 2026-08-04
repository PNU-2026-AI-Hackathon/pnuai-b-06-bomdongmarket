import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Textarea } from '@/components/common/Textarea';

describe('Textarea', () => {
  it('label과 helper text를 control에 연결한다', () => {
    render(
      <Textarea
        helperText="최대 500자까지 입력할 수 있습니다."
        label="매칭 신청 메시지"
      />,
    );

    const textarea = screen.getByRole('textbox', { name: '매칭 신청 메시지' });
    const helper = screen.getByText('최대 500자까지 입력할 수 있습니다.');

    expect(textarea).toHaveAccessibleDescription(helper.textContent ?? '');
  });

  it('오류 메시지와 invalid 상태를 함께 제공한다', () => {
    render(<Textarea errorMessage="메시지를 입력해 주세요." label="메시지" />);

    expect(screen.getByRole('textbox', { name: '메시지' })).toBeInvalid();
    expect(screen.getByRole('alert')).toHaveTextContent('메시지를 입력해 주세요.');
  });
});
