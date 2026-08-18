import { cleanup, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { clearAuthSession, saveAuthSession } from '@/auth/session';
import { resetMockContract, saveMockContractTerms } from '@/mocks/mockContract';
import { ContractPage } from '@/pages/contract';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { ContractDetail, UserRole } from '@/types/api';

// 서비스 함수를 목으로 바꾸지 않고 mockContract의 상태 기계를 그대로 씁니다 —
// "저장하면 동의가 풀린다", "양측이 동의해야 확정된다" 같은 규칙까지 함께 검증됩니다.

const session = {
  userId: 2,
  email: 'farmer@example.com',
  nickname: '도심농부',
  roles: ['CONSUMER'] as UserRole[],
};

const savedTerms = {
  monthlyRent: 500000,
  maintenanceFee: 50000,
  maintenanceFeePayer: 'FARMER' as const,
  deposit: 3000000,
  startDate: '2026-09-01',
  endDate: '2027-08-31',
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

beforeEach(() => {
  resetMockContract();
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

  it('종료일이 시작일보다 앞서면 저장하지 않고 오류를 알린다', async () => {
    const user = userEvent.setup();
    renderPage({ viewerRole: 'OWNER', ...savedTerms });

    const endDate = await screen.findByLabelText('계약 종료일');
    await user.clear(endDate);
    await user.type(endDate, '2026-08-01');
    await user.click(screen.getByRole('button', { name: '저장' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '계약 종료일은 시작일보다 뒤여야 합니다.',
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
    // 더 기다릴 동의가 없으므로 '동의 대기'는 남지 않습니다.
    expect(screen.queryByText('동의 대기')).not.toBeInTheDocument();
    expect(screen.getAllByText('계약 취소')).toHaveLength(2);
  });

  it('한 쪽이 이미 동의한 계약이 취소되면 동의 완료는 남고 대기만 취소로 바뀐다', async () => {
    renderPage({
      viewerRole: 'FARMER',
      ownerAgreed: true,
      status: 'CANCELED',
      ...savedTerms,
    });

    expect(await screen.findByText('동의 완료')).toBeInTheDocument();
    expect(screen.getByText('계약 취소')).toBeInTheDocument();
    expect(screen.queryByText('동의 대기')).not.toBeInTheDocument();
  });
});
