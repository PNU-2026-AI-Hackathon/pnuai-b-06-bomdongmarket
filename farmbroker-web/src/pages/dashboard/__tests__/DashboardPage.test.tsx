import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { clearAuthSession, saveAuthSession } from '@/auth/session';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { renderWithProviders } from '@/test/renderWithProviders';

describe('Dashboard pages', () => {
  function signIn(roles: Array<'OWNER' | 'FARMER' | 'CONSUMER'>) {
    saveAuthSession({
      userId: 1,
      email: 'user@example.com',
      nickname: '그린스페이스랩',
      roles,
    });
  }

  beforeEach(() => {
    clearAuthSession();
    window.sessionStorage.clear();
  });

  it('등록 공간, 계약 공간, 찜한 상품을 슬라이드로 렌더링한다', async () => {
    signIn(['OWNER']);
    // 찜 목업은 상품 id 배열만 저장한다 — 찜에는 수량이 없다.
    window.sessionStorage.setItem('farmbroker.mock.wishlist', JSON.stringify([1]));
    renderWithProviders(<DashboardPage />);

    expect(
      screen.getByRole('heading', { level: 1, name: '대시보드' }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('heading', { level: 2, name: '내가 등록한 공간' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: '계약한 공간' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: '찜한 상품' }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole('link', { name: '부산대 앞 20평 상가 공실 공간 상세 보기' })[0],
    ).toHaveAttribute('href', '/spaces/1');
    expect(
      screen.getByRole('link', { name: '버터헤드 상추 상품 상세 보기' }),
    ).toHaveAttribute('href', '/market/1');
    expect(screen.queryByText('빠른 실행')).not.toBeInTheDocument();
    expect(screen.queryByText('전체보기')).not.toBeInTheDocument();
    expect(screen.queryByText('도심농부 김민준')).not.toBeInTheDocument();
  });
});
