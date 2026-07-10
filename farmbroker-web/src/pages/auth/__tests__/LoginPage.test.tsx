import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { renderWithProviders } from '@/test/renderWithProviders';
import { LoginPage } from '@/pages/auth/LoginPage';

describe('LoginPage', () => {
  it('이메일 로그인 폼만 렌더링한다', () => {
    renderWithProviders(<LoginPage />);

    expect(screen.getByRole('heading', { name: '봄동마켓 로그인' })).toBeInTheDocument();
    expect(screen.getByLabelText(/이메일/i)).toHaveValue('');
    expect(screen.getByPlaceholderText('email@example.com')).toBeInTheDocument();
    expect(screen.getByLabelText(/비밀번호/i)).toHaveValue('');
    expect(screen.getByPlaceholderText('비밀번호를 입력해 주세요')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '로그인' })).toBeEnabled();
    expect(screen.queryByText(/Google로 계속하기/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/카카오로 계속하기/i)).not.toBeInTheDocument();
    expect(screen.queryByText('공간 제공자')).not.toBeInTheDocument();
  });

  it('빈 값과 잘못된 입력에 검증 메시지를 표시한다', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    const emailInput = screen.getByLabelText(/이메일/i);
    const passwordInput = screen.getByLabelText(/비밀번호/i);

    await user.click(screen.getByRole('button', { name: '로그인' }));

    expect(screen.getByText('이메일을 입력해 주세요.')).toBeInTheDocument();
    expect(screen.getByText('비밀번호를 입력해 주세요.')).toBeInTheDocument();
    expect(emailInput).toHaveAttribute('aria-invalid', 'true');
    expect(passwordInput).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('button', { name: '로그인' })).toBeDisabled();

    await user.type(emailInput, 'invalid-email');
    await user.type(passwordInput, '1234');

    expect(screen.getByText('올바른 이메일 형식을 입력해 주세요.')).toBeInTheDocument();
    expect(screen.getByText('비밀번호는 8자 이상 입력해 주세요.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '로그인' })).toBeDisabled();

    await user.clear(emailInput);
    await user.type(emailInput, 'owner@example.com');
    await user.clear(passwordInput);
    await user.type(passwordInput, '12345678');

    expect(screen.getByRole('button', { name: '로그인' })).toBeEnabled();
  });
});
