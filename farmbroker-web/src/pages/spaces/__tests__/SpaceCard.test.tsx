import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { mockSpaces } from '@/mocks/mockSpaces';
import { renderWithProviders } from '@/test/renderWithProviders';
import { SpaceCard } from '@/pages/spaces/components/SpaceCard';

describe('SpaceCard', () => {
  it('공간 요약 정보와 상세 링크를 표시한다', () => {
    const space = mockSpaces[0];

    renderWithProviders(<SpaceCard space={space} />);

    expect(screen.getByText(space.title)).toBeInTheDocument();
    expect(screen.getByText('매칭 가능')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /자세히 보기/i })).toHaveAttribute(
      'href',
      `/spaces/${space.spaceId}`,
    );
  });

  it('이미지 URL이 없거나 로드에 실패하면 대체 UI를 표시한다', () => {
    const space = mockSpaces[0];
    const { rerender } = renderWithProviders(<SpaceCard space={space} />);

    fireEvent.error(screen.getByRole('img', { name: space.title }));
    expect(
      screen.getByRole('img', { name: `${space.title} 이미지 없음` }),
    ).toBeInTheDocument();

    rerender(<SpaceCard space={{ ...space, imageUrl: null }} />);
    expect(screen.getByText('등록된 이미지 없음')).toBeInTheDocument();
  });
});
