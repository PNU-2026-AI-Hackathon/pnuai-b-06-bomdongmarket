import { within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { clearAuthSession, saveAuthSession } from '@/auth/session';
import { Header } from '@/components/layout/Header';
import { PRIMARY_NAVIGATION } from '@/constants/navigation';
import { ROUTES } from '@/constants/routes';
import { renderWithProviders } from '@/test/renderWithProviders';

describe('Header', () => {
  beforeEach(() => clearAuthSession());

  it('데스크톱 내비게이션에 넓은 간격과 클릭 영역을 제공한다', () => {
    const { getByRole } = renderWithProviders(<Header />);
    expect(getByRole('banner')).toHaveAttribute('data-build', 'auth-header-v2');
    const navigation = getByRole('navigation', { name: '주요 내비게이션' });

    expect(navigation).toHaveClass('gap-2', 'xl:gap-3');

    PRIMARY_NAVIGATION.forEach((item) => {
      const link = within(navigation).getByRole('link', { name: item.label });
      expect(link).toHaveAttribute('href', item.href);
      expect(link).toHaveClass('min-h-11', 'px-4', 'xl:px-5');
    });
  });

  it('비로그인 상태에서는 화면 크기와 관계없이 로그인 링크를 표시한다', () => {
    const { getByRole, queryByRole } = renderWithProviders(<Header />);
    const loginLink = getByRole('link', { name: '로그인' });

    expect(loginLink).toHaveAttribute('href', ROUTES.login);
    expect(loginLink).not.toHaveClass('hidden');
    expect(queryByRole('link', { name: /공간 등록|등록/ })).not.toBeInTheDocument();
  });

  it('로그인 상태에서는 로그인 대신 사용자 닉네임을 표시한다', () => {
    saveAuthSession({
      accessToken: 'test-access-token',
      user: {
        userId: 2,
        email: 'farmer@example.com',
        nickname: '도시농부',
        role: 'FARMER',
      },
    });

    const { getByRole, queryByRole } = renderWithProviders(<Header />, {
      authenticated: true,
    });

    expect(getByRole('link', { name: '도시농부 마이페이지' })).toHaveAttribute(
      'href',
      ROUTES.myPage,
    );
    expect(queryByRole('link', { name: '로그인' })).not.toBeInTheDocument();
    expect(queryByRole('link', { name: /공간 등록|등록/ })).not.toBeInTheDocument();
  });
});
