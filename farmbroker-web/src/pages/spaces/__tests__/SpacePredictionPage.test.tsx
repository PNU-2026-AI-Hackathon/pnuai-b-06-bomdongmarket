import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

import { AppRouter } from '@/app/router';
import { clearAuthSession } from '@/auth/session';
import { renderWithProviders } from '@/test/renderWithProviders';

async function fillCreateForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('공간 이름'), '테스트 상가 공실');
  await user.type(screen.getByLabelText('공간 위치'), '부산광역시 금정구 장전동');
  await user.type(screen.getByLabelText('전체 면적'), '66');
  await user.type(screen.getByLabelText('층수'), '2');
  await user.type(screen.getByLabelText('희망 월세'), '500000');
}

describe('공간 등록 전 수익 예측 확인', () => {
  beforeEach(() => clearAuthSession());

  it('폼 입력 후 예측 화면에서 수익 지표와 입력 요약을 보여준다', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AppRouter />, { authenticated: true, route: '/spaces/new' });

    await fillCreateForm(user);
    await user.click(screen.getByRole('button', { name: /수익 예측 확인/i }));

    expect(
      await screen.findByRole('heading', { name: '예상 수익을 확인하고 등록하세요' }),
    ).toBeInTheDocument();
    expect(screen.getByText('테스트 상가 공실')).toBeInTheDocument();
    expect(screen.getByText('66㎡')).toBeInTheDocument();

    // 66㎡ 기준 배분수익 1위는 딸기이며 수치는 서버 계산기 값과 같아야 합니다.
    expect(await screen.findByRole('heading', { name: '딸기' })).toBeInTheDocument();
    expect(screen.getByText('예상 월 매출')).toBeInTheDocument();
    expect(screen.getByText('₩6,629,040')).toBeInTheDocument();
    expect(screen.getByText('₩1,186,585')).toBeInTheDocument();
    expect(screen.getByText('장기계약형')).toBeInTheDocument();
    // 입력한 희망 월세가 예측의 비교 기준과 요약 카드 양쪽에 그대로 반영됩니다.
    expect(screen.getAllByText('₩500,000')).toHaveLength(2);
  });

  it('면적을 늘리면 예측 수치도 함께 커진다', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AppRouter />, { authenticated: true, route: '/spaces/new' });

    await user.type(screen.getByLabelText('공간 이름'), '넓은 공실');
    await user.type(screen.getByLabelText('공간 위치'), '부산광역시 사하구');
    await user.type(screen.getByLabelText('전체 면적'), '132');
    await user.type(screen.getByLabelText('층수'), '1');
    await user.type(screen.getByLabelText('희망 월세'), '500000');
    await user.click(screen.getByRole('button', { name: /수익 예측 확인/i }));

    // 66㎡의 두 배 면적이므로 매출도 두 배가 됩니다.
    expect(await screen.findByText('₩13,258,080')).toBeInTheDocument();
    expect(screen.getByText('316.8㎡')).toBeInTheDocument();
  });

  it('예측 화면에서 등록하면 완료 상태를 안내한다', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AppRouter />, { authenticated: true, route: '/spaces/new' });

    await fillCreateForm(user);
    await user.click(screen.getByRole('button', { name: /수익 예측 확인/i }));
    await user.click(await screen.findByRole('button', { name: '공간 등록' }));

    expect(
      await screen.findByRole('heading', { name: '공간 등록이 완료되었습니다' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /등록한 공간 보러 가기/i }),
    ).toBeInTheDocument();
  });

  it('입력값 없이 예측 화면에 직접 들어오면 등록 폼으로 되돌린다', async () => {
    renderWithProviders(<AppRouter />, {
      authenticated: true,
      route: '/spaces/new/prediction',
    });

    expect(
      await screen.findByRole('heading', { name: '새 재배 공간 등록' }),
    ).toBeInTheDocument();
  });

  it('수정하기로 돌아가면 입력값이 유지된다', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AppRouter />, { authenticated: true, route: '/spaces/new' });

    await fillCreateForm(user);
    await user.click(screen.getByRole('button', { name: /수익 예측 확인/i }));
    await user.click(await screen.findByRole('link', { name: /입력 정보 수정하기/i }));

    expect(await screen.findByLabelText('공간 이름')).toHaveValue('테스트 상가 공실');
    expect(screen.getByLabelText('희망 월세')).toHaveValue(500000);
  });
});
