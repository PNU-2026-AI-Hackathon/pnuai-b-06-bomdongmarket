import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SpaceImageGallery } from '@/pages/space-detail/components/SpaceImageGallery';
import { renderWithProviders } from '@/test/renderWithProviders';

describe('SpaceImageGallery', () => {
  it('등록 이미지가 없으면 기본 이미지 컴포넌트를 표시한다', () => {
    renderWithProviders(<SpaceImageGallery imageUrls={[]} title="이미지 없는 공간" />);

    expect(
      screen.getByRole('img', { name: '이미지 없는 공간 이미지 없음' }),
    ).toBeInTheDocument();
    expect(screen.getByText('등록된 이미지 없음')).toBeInTheDocument();
  });
});
