import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { clearAuthSession, saveAuthSession } from '@/auth/session';
import { SpaceMatchingRequestCard } from '@/pages/space-detail/components/SpaceMatchingRequestCard';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { UserRole } from '@/types/api';

const consumerSession = {
  userId: 2,
  email: 'farmer@example.com',
  nickname: '도시농부',
  roles: ['CONSUMER'] as UserRole[],
};

afterEach(() => {
  cleanup();
  clearAuthSession();
});

describe('SpaceMatchingRequestCard', () => {
  it('비로그인 사용자는 로그인으로 안내한다', () => {
    renderWithProviders(<SpaceMatchingRequestCard spaceId={1} />);

    expect(
      screen.getByRole('link', { name: /로그인하고 매칭 신청하기/i }),
    ).toHaveAttribute('href', '/login');
  });

  it('로그인 사용자는 해당 공간의 신청 화면으로 이동한다', () => {
    saveAuthSession(consumerSession);

    renderWithProviders(<SpaceMatchingRequestCard spaceId={7} />);

    expect(screen.getByRole('link', { name: /매칭 신청하기/i })).toHaveAttribute(
      'href',
      '/spaces/7/apply',
    );
  });
});
