import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SpaceCreatePage } from '@/pages/spaces/SpaceCreatePage';
import { renderWithProviders } from '@/test/renderWithProviders';

describe('SpaceCreatePage', () => {
  it('공간 예시를 입력값이 아닌 placeholder로 보여준다', () => {
    renderWithProviders(<SpaceCreatePage />);

    expect(screen.getByLabelText('공간 이름')).toHaveValue('');
    expect(
      screen.getByPlaceholderText('예: 부산대 앞 20평 상가 공실'),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('예: 부산광역시 금정구 장전동'),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText('예: 66')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('예: 2')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('예: 500000')).toBeInTheDocument();
    expect(screen.getByLabelText('상세 메모')).toHaveValue('');
  });
});
