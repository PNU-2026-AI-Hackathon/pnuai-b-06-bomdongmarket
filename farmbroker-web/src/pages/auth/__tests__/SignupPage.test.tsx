import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { LoginPage } from '@/pages/auth/LoginPage';
import { SignupPage } from '@/pages/auth/SignupPage';
import { renderWithProviders } from '@/test/renderWithProviders';

describe('SignupPage', () => {
  it('필수 입력값과 사용자 유형을 검증한다', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SignupPage />);

    await user.click(screen.getByRole('button', { name: '회원가입' }));

    expect(screen.getByText('이름 또는 닉네임을 입력해 주세요.')).toBeInTheDocument();
    expect(screen.getByText('이메일을 입력해 주세요.')).toBeInTheDocument();
    expect(screen.getByText('비밀번호를 입력해 주세요.')).toBeInTheDocument();
    expect(screen.getByText('비밀번호 확인을 입력해 주세요.')).toBeInTheDocument();
    expect(screen.getByText('사용자 유형을 선택해 주세요.')).toBeInTheDocument();
  });

  it('일치하지 않는 비밀번호를 안내한다', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SignupPage />);

    await user.type(screen.getByLabelText('비밀번호'), '12345678');
    await user.type(screen.getByLabelText('비밀번호 확인'), '87654321');
    await user.tab();

    expect(screen.getByText('비밀번호가 일치하지 않습니다.')).toBeInTheDocument();
  });

  it('회원가입을 완료하면 로그인 페이지로 이동한다', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <Routes>
        <Route element={<SignupPage />} path="/signup" />
        <Route element={<LoginPage />} path="/login" />
      </Routes>,
      { route: '/signup' },
    );

    await user.type(screen.getByLabelText('이름 또는 닉네임'), '도시농부');
    await user.type(screen.getByLabelText('이메일'), 'farmer@example.com');
    await user.type(screen.getByLabelText('비밀번호'), '12345678');
    await user.type(screen.getByLabelText('비밀번호 확인'), '12345678');
    await user.click(screen.getByRole('radio', { name: /^농부/ }));
    await user.click(screen.getByRole('button', { name: '회원가입' }));

    expect(
      await screen.findByRole('heading', { name: '봄동마켓 로그인' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('회원가입이 완료되었습니다. 새 계정으로 로그인해 주세요.'),
    ).toBeInTheDocument();
  });
});
