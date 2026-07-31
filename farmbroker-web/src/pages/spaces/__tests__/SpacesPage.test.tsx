import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { renderWithProviders } from '@/test/renderWithProviders';
import { SpaceList } from '@/pages/spaces/components/SpaceList';
import { SpacesPage } from '@/pages/spaces/SpacesPage';

describe('SpacesPage', () => {
  it('mock 서비스의 등록 공간을 렌더링한다', async () => {
    renderWithProviders(<SpacesPage />);

    expect(screen.getByText(/등록된 공간을 불러오는 중입니다/i)).toBeInTheDocument();
    expect(await screen.findByText(/부산대 앞 20평 상가 공실/i)).toBeInTheDocument();
  });

  it('키워드로 공간을 필터링한다', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SpacesPage />);

    await screen.findByText(/부산대 앞 20평 상가 공실/i);
    await user.type(screen.getByRole('textbox', { name: /공간 검색/i }), '서면');

    await waitFor(() => {
      expect(screen.getByText(/서면 지하 재배 공간/i)).toBeInTheDocument();
    });
  });

  it('빈 상태와 에러 상태를 보여준다', () => {
    const { rerender } = renderWithProviders(
      <SpaceList error={null} onRetry={() => undefined} spaces={[]} status="success" />,
    );

    expect(screen.getByText(/검색된 공간이 없습니다/i)).toBeInTheDocument();

    rerender(
      <SpaceList
        error="네트워크 오류"
        onRetry={() => undefined}
        spaces={[]}
        status="error"
      />,
    );
    expect(screen.getByText(/네트워크 오류/i)).toBeInTheDocument();
  });
});
