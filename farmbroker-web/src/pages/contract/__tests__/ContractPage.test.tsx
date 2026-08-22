import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuth } from '@/auth/authContext';
import { clearAuthSession, saveAuthSession } from '@/auth/session';
import { resetMockContract, saveMockContractTerms } from '@/mocks/mockContract';
import { ContractPage } from '@/pages/contract';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { ContractDetail, UserRole } from '@/types/api';

// 서비스 함수를 목으로 바꾸지 않고 mockContract의 상태 기계를 그대로 씁니다 —
// "저장하면 동의가 풀린다", "양측이 동의해야 확정된다" 같은 규칙까지 함께 검증됩니다.
// 다만 역할 부여는 서버에서만 일어나므로 /users/me만 목으로 두고 응답을 갈아 끼웁니다.

const authServiceMocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
}));

vi.mock('@/services/authService', () => ({
  getCurrentUser: authServiceMocks.getCurrentUser,
  login: authServiceMocks.login,
  logout: authServiceMocks.logout,
}));

const session = {
  userId: 2,
  email: 'farmer@example.com',
  nickname: '도심농부',
  roles: ['CONSUMER'] as UserRole[],
};

// 시작일은 오늘 ±2주 안에서만 고를 수 있어 날짜를 고정하면 시간이 지나면서 테스트가 깨집니다.
// contractDates의 구현을 빌려쓰지 않고 따로 계산해 검증 대상과 기대값을 독립시킵니다.
function daysFromToday(offset: number) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

const savedTerms = {
  monthlyRent: 500000,
  maintenanceFee: 50000,
  maintenanceFeePayer: 'FARMER' as const,
  deposit: 3000000,
  startDate: daysFromToday(7),
  endDate: daysFromToday(372),
};

function renderPage(overrides: Partial<ContractDetail> = {}) {
  resetMockContract(overrides);
  saveAuthSession(session);

  return renderWithProviders(
    <Routes>
      <Route element={<ContractPage />} path="/matchings/:matchingId/contract" />
    </Routes>,
    { route: '/matchings/21/contract' },
  );
}

// 계약 확정으로 역할이 늘었는지는 화면에 드러나지 않으므로 context 값을 그대로 그려 확인합니다.
function RoleProbe() {
  const { user } = useAuth();
  return <p>{user?.roles.join(',')}</p>;
}

beforeEach(() => {
  resetMockContract();
  authServiceMocks.getCurrentUser.mockReset();
  authServiceMocks.getCurrentUser.mockResolvedValue(session);
});

afterEach(() => {
  cleanup();
  clearAuthSession();
});

describe('ContractPage', () => {
  it('이름과 주소는 입력받지 않고 기존 정보를 그대로 보여준다', async () => {
    renderPage();

    // 닉네임은 계약 당사자·동의 현황 카드와 관리비 책임소재 선택지에 나옵니다.
    expect(await screen.findAllByText('옥상건물주')).toHaveLength(3);
    expect(screen.getAllByText('도심농부')).toHaveLength(3);
    expect(screen.getByText('부산광역시 금정구 부산대학로 63번길 2')).toBeInTheDocument();
  });

  it('동의 현황은 역할 이름 대신 각자의 닉네임으로 보여준다', async () => {
    renderPage({ ownerAgreed: true, ...savedTerms });

    const agreements = (await screen.findByText('동의 현황')).parentElement as HTMLElement;
    expect(within(agreements).getByText('옥상건물주')).toBeInTheDocument();
    expect(within(agreements).getByText('도심농부')).toBeInTheDocument();
    expect(within(agreements).queryByText('공간 제공자')).not.toBeInTheDocument();
    expect(within(agreements).queryByText('도심 농부')).not.toBeInTheDocument();
  });

  it('도심 농부는 조건을 수정할 수 없고 저장 버튼도 없다', async () => {
    renderPage({ viewerRole: 'FARMER', ...savedTerms });

    expect(await screen.findByLabelText('월세')).toHaveAttribute('readonly');
    expect(screen.getByLabelText('관리비')).toHaveAttribute('readonly');
    expect(screen.getByLabelText('보증금')).toHaveAttribute('readonly');
    // 선택박스에는 readOnly가 없어 비활성으로 막습니다.
    expect(screen.getByLabelText('관리비 책임소재')).toBeDisabled();
    expect(screen.getByLabelText('계약 시작일')).toHaveAttribute('readonly');
    expect(screen.getByLabelText('계약 종료일')).toHaveAttribute('readonly');
    expect(screen.queryByRole('button', { name: '저장' })).not.toBeInTheDocument();
  });

  it('관리비 책임소재는 양측 닉네임 중 하나로 고른다', async () => {
    const user = userEvent.setup();
    renderPage({ viewerRole: 'OWNER', ...savedTerms });

    const payer = await screen.findByLabelText('관리비 책임소재');
    expect(payer).toHaveValue('FARMER');
    expect(
      within(payer as HTMLSelectElement)
        .getAllByRole('option')
        .map((option) => option.textContent),
    ).toEqual(['선택해 주세요', '옥상건물주', '도심농부']);

    await user.selectOptions(payer, '옥상건물주');
    await user.click(screen.getByRole('button', { name: '저장' }));

    await waitFor(() => expect(screen.getByLabelText('관리비 책임소재')).toHaveValue('OWNER'));
  });

  it('금액 칸은 1 이상의 정수만 받는다', async () => {
    const user = userEvent.setup();
    renderPage({ viewerRole: 'OWNER', ...savedTerms });

    // 음수·소수·지수 표기는 키 입력 단계에서 막습니다.
    const maintenanceFee = await screen.findByLabelText('관리비');
    await user.clear(maintenanceFee);
    await waitFor(() => expect(maintenanceFee).toHaveValue(null));
    await user.type(maintenanceFee, '-1.5e3');
    expect(maintenanceFee).toHaveValue(153);

    for (const label of ['월세', '관리비', '보증금']) {
      expect(screen.getByLabelText(label)).toHaveAttribute('min', '1');
      expect(screen.getByLabelText(label)).toHaveAttribute('step', '1');
    }
  });


  it('저장하지 않은 조건 변경이 있으면 저장 전까지 계약에 동의할 수 없다', async () => {
    const user = userEvent.setup();
    renderPage({ viewerRole: 'OWNER', ...savedTerms });

    const monthlyRent = await screen.findByLabelText('월세');
    expect(screen.getByRole('button', { name: '계약' })).toBeEnabled();

    await user.clear(monthlyRent);
    await user.type(monthlyRent, '900000');

    // 입력값만 바뀐 동안 동의하면 화면에 없는 500,000원 조건에 동의하게 됩니다.
    expect(screen.getByRole('button', { name: '계약' })).toBeDisabled();
    expect(
      screen.getByText('저장하지 않은 변경사항이 있습니다. 먼저 저장해 주세요.'),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '저장' }));

    await waitFor(() => expect(screen.getByRole('button', { name: '계약' })).toBeEnabled());
    expect(
      screen.queryByText('저장하지 않은 변경사항이 있습니다. 먼저 저장해 주세요.'),
    ).not.toBeInTheDocument();
  });

  it('공간 제공자가 조건을 저장하면 이미 받은 동의가 풀린다', async () => {
    const user = userEvent.setup();
    renderPage({ viewerRole: 'OWNER', farmerAgreed: true, ...savedTerms });

    const monthlyRent = await screen.findByLabelText('월세');
    await user.clear(monthlyRent);
    await user.type(monthlyRent, '900000');
    await user.click(screen.getByRole('button', { name: '저장' }));

    // 저장이 서버까지 다녀와야만 '동의 완료' 배지가 사라집니다.
    await waitFor(() =>
      expect(screen.queryByText('동의 완료')).not.toBeInTheDocument(),
    );
    expect(screen.getByLabelText('월세')).toHaveValue(900000);
  });

  // 시작일은 오늘 ±2주, 종료일은 시작일 다음 날부터 — 금액 칸의 min/step과 같은 방식으로
  // 달력 단계에서 막습니다. 제출 시점 재검사(validatePeriod)는 contractDates.test.ts에서 다룹니다.
  it('계약 시작일은 오늘 ±2주, 종료일은 시작일 다음 날부터만 고를 수 있다', async () => {
    renderPage({ viewerRole: 'OWNER', ...savedTerms });

    const startDate = await screen.findByLabelText('계약 시작일');
    expect(startDate).toHaveAttribute('min', daysFromToday(-14));
    expect(startDate).toHaveAttribute('max', daysFromToday(14));
    // 저장된 시작일이 +7일이므로 종료일 하한은 +8일입니다.
    expect(screen.getByLabelText('계약 종료일')).toHaveAttribute('min', daysFromToday(8));
  });

  it('창 밖의 시작일과 시작일보다 앞선 종료일은 칸마다 따로 알린다', async () => {
    const user = userEvent.setup();
    renderPage({ viewerRole: 'OWNER', ...savedTerms });

    // 달력에서 고를 수 없는 값이 붙여넣기·자동완성으로 들어온 상황입니다.
    const startDate = await screen.findByLabelText('계약 시작일');
    fireEvent.change(startDate, { target: { value: daysFromToday(15) } });
    fireEvent.change(screen.getByLabelText('계약 종료일'), {
      target: { value: daysFromToday(1) },
    });
    await user.click(screen.getByRole('button', { name: '저장' }));

    const alerts = (await screen.findAllByRole('alert')).map((el) => el.textContent);
    expect(alerts).toContain('계약 시작일은 오늘부터 앞뒤 2주 이내여야 합니다.');
    expect(alerts).toContain('계약 종료일은 시작일보다 뒤여야 합니다.');
    // 저장되지 않았으므로 변경사항 안내가 그대로 남고 동의도 막혀 있습니다.
    expect(
      screen.getByText('저장하지 않은 변경사항이 있습니다. 먼저 저장해 주세요.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '계약' })).toBeDisabled();
  });

  // 브라우저 기본 검증을 켜 두면 시작일이 이미 창 밖인 계약에서 제출이 통째로 취소되어
  // 아무 안내 없이 저장 버튼이 먹통이 됩니다 — 금액만 고치려던 제공자가 막혀 버립니다.
  it('저장된 시작일이 이미 창 밖이어도 제공자가 고쳐서 저장할 수 있다', async () => {
    const user = userEvent.setup();
    renderPage({
      viewerRole: 'OWNER',
      ...savedTerms,
      startDate: daysFromToday(60),
      endDate: daysFromToday(425),
    });

    const monthlyRent = await screen.findByLabelText('월세');
    await user.clear(monthlyRent);
    await user.type(monthlyRent, '900000');
    await user.click(screen.getByRole('button', { name: '저장' }));

    // 먹통이 되는 대신 무엇이 문제인지 알려 줍니다.
    expect(await screen.findByRole('alert')).toHaveTextContent(
      '계약 시작일은 오늘부터 앞뒤 2주 이내여야 합니다.',
    );

    // 창 안의 날짜로 고치면 그대로 저장됩니다.
    fireEvent.change(screen.getByLabelText('계약 시작일'), {
      target: { value: daysFromToday(7) },
    });
    await user.click(screen.getByRole('button', { name: '저장' }));

    await waitFor(() =>
      expect(
        screen.queryByText('저장하지 않은 변경사항이 있습니다. 먼저 저장해 주세요.'),
      ).not.toBeInTheDocument(),
    );
    expect(screen.getByLabelText('월세')).toHaveValue(900000);
    expect(screen.getByLabelText('계약 시작일')).toHaveValue(daysFromToday(7));
  });

  it('관리비 책임소재를 고르지 않으면 저장하지 않고 알린다', async () => {
    const user = userEvent.setup();
    renderPage({ viewerRole: 'OWNER', ...savedTerms, maintenanceFeePayer: null });

    await user.click(await screen.findByRole('button', { name: '저장' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '관리비 책임소재를 선택해 주세요.',
    );
  });

  it('계약 버튼은 모달에서 확인해야 동의가 반영된다', async () => {
    const user = userEvent.setup();
    renderPage({ viewerRole: 'FARMER', ...savedTerms });

    await user.click(await screen.findByRole('button', { name: '계약' }));
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveTextContent('계약에 동의하시겠습니까?');

    await user.click(screen.getByRole('button', { name: '계약 동의' }));

    expect(await screen.findByRole('button', { name: '동의 완료' })).toBeDisabled();
  });

  it('조회한 뒤 조건이 바뀌었으면 동의가 거절되고 바뀐 조건을 다시 보여준다', async () => {
    const user = userEvent.setup();
    renderPage({ viewerRole: 'FARMER', ...savedTerms });

    // 농부가 화면을 열어 둔 사이 소유자가 다른 세션에서 월세를 올린 상황입니다.
    expect(await screen.findByLabelText('월세')).toHaveValue(500000);
    saveMockContractTerms(21, { ...savedTerms, monthlyRent: 900000 });

    await user.click(screen.getByRole('button', { name: '계약' }));
    await user.click(screen.getByRole('button', { name: '계약 동의' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '계약 조건이 변경되었습니다. 다시 확인해 주세요.',
    );
    // 재조회로 바뀐 조건이 화면에 반영되고, 그 조건에는 다시 동의할 수 있어야 합니다.
    await waitFor(() => expect(screen.getByLabelText('월세')).toHaveValue(900000));
    expect(screen.getByRole('button', { name: '계약' })).toBeEnabled();
  });

  it('양측이 모두 동의하면 계약이 확정된다', async () => {
    const user = userEvent.setup();
    renderPage({ viewerRole: 'FARMER', ownerAgreed: true, ...savedTerms });

    await user.click(await screen.findByRole('button', { name: '계약' }));
    await user.click(screen.getByRole('button', { name: '계약 동의' }));

    expect(await screen.findByText('계약이 확정되었습니다.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '계약 취소' })).not.toBeInTheDocument();
  });

  it('계약이 확정되면 새로 부여된 FARMER 역할을 새로고침 없이 반영한다', async () => {
    // 확정 시 서버가 신청자에게 FARMER를 부여하지만 계약 응답에는 담기지 않아,
    // 화면이 직접 /users/me를 다시 받아야 상품 등록 같은 농부 전용 기능이 열립니다.
    const user = userEvent.setup();
    authServiceMocks.getCurrentUser
      .mockResolvedValueOnce(session)
      .mockResolvedValueOnce({ ...session, roles: ['CONSUMER', 'FARMER'] });
    resetMockContract({ viewerRole: 'FARMER', ownerAgreed: true, ...savedTerms });
    saveAuthSession(session);

    renderWithProviders(
      <>
        <RoleProbe />
        <Routes>
          <Route element={<ContractPage />} path="/matchings/:matchingId/contract" />
        </Routes>
      </>,
      { route: '/matchings/21/contract' },
    );

    expect(await screen.findByText('CONSUMER')).toBeInTheDocument();

    await user.click(await screen.findByRole('button', { name: '계약' }));
    await user.click(screen.getByRole('button', { name: '계약 동의' }));

    expect(await screen.findByText('계약이 확정되었습니다.')).toBeInTheDocument();
    expect(await screen.findByText('CONSUMER,FARMER')).toBeInTheDocument();
  });

  it('공간 제공자 쪽에서는 계약이 확정돼도 사용자 정보를 다시 받지 않는다', async () => {
    // 역할을 받는 쪽은 신청자뿐이라 공간 제공자 화면에서는 헛된 요청이 나가면 안 됩니다.
    const user = userEvent.setup();
    resetMockContract({ viewerRole: 'OWNER', farmerAgreed: true, ...savedTerms });
    saveAuthSession(session);

    renderWithProviders(
      <Routes>
        <Route element={<ContractPage />} path="/matchings/:matchingId/contract" />
      </Routes>,
      { route: '/matchings/21/contract' },
    );

    await user.click(await screen.findByRole('button', { name: '계약' }));
    await user.click(screen.getByRole('button', { name: '계약 동의' }));

    expect(await screen.findByText('계약이 확정되었습니다.')).toBeInTheDocument();
    // 부팅 재검증 1회 외에는 호출되지 않습니다.
    expect(authServiceMocks.getCurrentUser).toHaveBeenCalledTimes(1);
  });

  it('계약 취소는 모달에서 확인하면 한 쪽만 눌러도 취소된다', async () => {
    const user = userEvent.setup();
    renderPage({ viewerRole: 'FARMER', ...savedTerms });

    await user.click(await screen.findByRole('button', { name: '계약 취소' }));
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveTextContent('계약을 취소하시겠습니까?');

    await user.click(
      screen.getAllByRole('button', { name: '계약 취소' }).at(-1) as HTMLElement,
    );

    expect(await screen.findByText('이 계약은 취소되었습니다.')).toBeInTheDocument();
    // 취소 표시는 누른 쪽(도심농부)에만 붙고, 상대는 직전 상태를 그대로 둡니다.
    const agreements = screen.getByText('동의 현황').parentElement as HTMLElement;
    expect(within(agreements).getAllByText('계약 취소')).toHaveLength(1);
    expect(within(agreements).getByText('동의 대기')).toBeInTheDocument();
  });

  it('취소한 쪽에만 취소 표시가 붙고 상대의 동의 완료는 남는다', async () => {
    renderPage({
      viewerRole: 'FARMER',
      ownerAgreed: true,
      canceledBy: 'FARMER',
      status: 'CANCELED',
      ...savedTerms,
    });

    expect(await screen.findByText('동의 완료')).toBeInTheDocument();
    expect(screen.getByText('계약 취소')).toBeInTheDocument();
    expect(screen.queryByText('동의 대기')).not.toBeInTheDocument();
  });

  // 확정에 밀려 자동 거절된 신청은 누군가 누른 게 아니라 취소자가 없습니다.
  it('취소한 사람을 모르는 계약은 양쪽에 취소로 표시한다', async () => {
    renderPage({
      viewerRole: 'FARMER',
      canceledBy: null,
      status: 'REJECTED',
      ...savedTerms,
    });

    const agreements = (await screen.findByText('동의 현황')).parentElement as HTMLElement;
    expect(within(agreements).getAllByText('계약 취소')).toHaveLength(2);
    expect(within(agreements).queryByText('동의 대기')).not.toBeInTheDocument();
  });
});
