import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { renderWithProviders } from '@/test/renderWithProviders';
import { SpaceDetailPage } from '@/pages/space-detail/SpaceDetailPage';

describe('SpaceDetailPage', () => {
  it('상세 데이터를 불러오고 AI 추천을 실행한다', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SpaceDetailPage />, { route: '/spaces/1' });

    expect(
      await screen.findByRole('heading', {
        name: /부산대 앞 20평 상가 공실/i,
      }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /AI 추천 실행/i }));
    expect(await screen.findByText(/배치 제안/i)).toBeInTheDocument();
    expect(screen.getAllByText(/버터헤드 상추/i).length).toBeGreaterThan(0);
  });

  it('로그인 사용자가 추천 결과에서 매칭을 신청한다', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SpaceDetailPage />, {
      authenticated: true,
      route: '/spaces/1',
    });

    await user.click(await screen.findByRole('button', { name: /AI 추천 실행/i }));
    await user.click(await screen.findByRole('button', { name: /매칭 신청 보내기/i }));

    expect(await screen.findByText('매칭 신청이 완료되었습니다.')).toBeInTheDocument();
  });
});
