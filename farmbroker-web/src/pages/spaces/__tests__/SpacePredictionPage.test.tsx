import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppRouter } from '@/app/router';
import { clearAuthSession } from '@/auth/session';
import { SEARCHED_ADDRESS, searchAddress } from '@/test/kakaoSdkMock';
import { renderWithProviders } from '@/test/renderWithProviders';

vi.mock('@/utils/kakaoSdk', async () =>
  (await import('@/test/kakaoSdkMock')).createKakaoSdkMock(),
);

async function fillCreateForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('공간 이름'), '테스트 상가 공실');
  await searchAddress(user);
  await user.type(screen.getByLabelText('상세 주소'), '3층 302호');
  await user.type(screen.getByLabelText('전체 면적(㎡)'), '66');
  await user.type(screen.getByLabelText('층수'), '2');
  await user.type(screen.getByLabelText('희망 월세(원)'), '500000');
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
    // 검색한 도로명주소와 직접 입력한 상세주소가 한 줄로 합쳐져 서버로 넘어갑니다.
    expect(screen.getByText(`${SEARCHED_ADDRESS} 3층 302호`)).toBeInTheDocument();

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
    await searchAddress(user);
    await user.type(screen.getByLabelText('상세 주소'), '1층 전체');
    await user.type(screen.getByLabelText('전체 면적(㎡)'), '132');
    await user.type(screen.getByLabelText('층수'), '1');
    await user.type(screen.getByLabelText('희망 월세(원)'), '500000');
    await user.click(screen.getByRole('button', { name: /수익 예측 확인/i }));

    // 66㎡의 두 배 면적이므로 매출도 두 배가 됩니다.
    expect(await screen.findByText('₩13,258,080')).toBeInTheDocument();
    expect(screen.getByText('316.8㎡')).toBeInTheDocument();
  });

  // 이 화면의 목적이 '등록 전 수익 확인'이므로 예측이 끝나기 전에는 등록을 막아야 한다.
  it('수익 예측이 끝나기 전에는 등록 버튼을 막는다', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AppRouter />, { authenticated: true, route: '/spaces/new' });

    await fillCreateForm(user);
    await user.click(screen.getByRole('button', { name: /수익 예측 확인/i }));

    // 예측 로딩 중에는 비활성 + 이유 안내
    const registerButton = await screen.findByRole('button', { name: '공간 등록' });
    expect(registerButton).toBeDisabled();
    expect(
      screen.getByText('예측 결과를 확인한 뒤 등록할 수 있습니다.'),
    ).toBeInTheDocument();

    // 예측이 도착하면 활성화되고 안내는 사라진다
    await waitFor(() => {
      expect(screen.getByRole('button', { name: '공간 등록' })).toBeEnabled();
    });
    expect(
      screen.queryByText('예측 결과를 확인한 뒤 등록할 수 있습니다.'),
    ).not.toBeInTheDocument();
  });

  it('예측 화면에서 등록하면 완료 상태를 안내한다', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AppRouter />, { authenticated: true, route: '/spaces/new' });

    await fillCreateForm(user);
    await user.click(screen.getByRole('button', { name: /수익 예측 확인/i }));

    // 예측이 도착해야 등록 버튼이 열린다.
    await waitFor(() => {
      expect(screen.getByRole('button', { name: '공간 등록' })).toBeEnabled();
    });
    await user.click(screen.getByRole('button', { name: '공간 등록' }));

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
    expect(screen.getByLabelText('희망 월세(원)')).toHaveValue(500000);
    // 합쳐서 보낸 주소가 원래의 두 칸으로 그대로 나뉘어 돌아옵니다.
    expect(screen.getByLabelText('주소')).toHaveValue(SEARCHED_ADDRESS);
    expect(screen.getByLabelText('상세 주소')).toHaveValue('3층 302호');
  });
});
