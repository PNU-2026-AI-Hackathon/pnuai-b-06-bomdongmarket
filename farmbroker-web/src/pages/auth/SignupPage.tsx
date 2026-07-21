import { ArrowRight, Lock, Mail, UserRound } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { Input } from '@/components/common/Input';
import { PageContainer } from '@/components/layout/PageContainer';
import { ROUTES } from '@/constants/routes';
import { useSignupForm } from '@/pages/auth/hooks/useSignupForm';
import { signup } from '@/services/authService';
import type { UserRole } from '@/types/api';
import { cn } from '@/utils/cn';

const roleOptions: Array<{ value: UserRole; label: string; description: string }> = [
  {
    value: 'FARMER',
    label: '농부',
    description: '공간을 선택해 스마트팜 재배에 참여합니다.',
  },
  {
    value: 'OWNER',
    label: '공간 대여자',
    description: '유휴 공간을 등록하고 농부와 연결합니다.',
  },
  {
    value: 'CONSUMER',
    label: '구매자',
    description: '가까운 농장에서 생산한 농작물을 구매합니다.',
  },
];

export function SignupPage() {
  const navigate = useNavigate();
  const {
    values,
    errors,
    hasErrors,
    isSubmitting,
    submitError,
    handleTextChange,
    handleBlur,
    selectRole,
    handleSubmit,
  } = useSignupForm(async (input) => {
    await signup(input);
    navigate(ROUTES.login, { replace: true, state: { signupCompleted: true } });
  });

  return (
    <PageContainer className="pb-28 pt-10 sm:pt-14 lg:py-16" narrow>
      <div className="mx-auto w-full max-w-2xl">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-soil-500">
            Join Farm Broker
          </p>
          <h1 className="mt-2 text-3xl font-black text-ink-900">봄동마켓 회원가입</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            이용 목적에 맞는 유형을 선택하고 도심 스마트팜 여정을 시작하세요.
          </p>
        </div>

        <Card className="mt-6 p-6 shadow-lift sm:p-8">
          <form className="grid gap-5" noValidate onSubmit={handleSubmit}>
            {submitError ? (
              <div
                className="rounded-app border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700"
                role="alert"
              >
                {submitError}
              </div>
            ) : null}

            <Input
              autoComplete="nickname"
              errorMessage={errors.nickname}
              icon={<UserRound className="h-4 w-4" aria-hidden />}
              label="이름 또는 닉네임"
              maxLength={30}
              name="nickname"
              onBlur={handleBlur}
              onChange={handleTextChange}
              placeholder="표시할 이름을 입력해 주세요"
              required
              value={values.nickname}
            />

            <Input
              autoComplete="email"
              errorMessage={errors.email}
              icon={<Mail className="h-4 w-4" aria-hidden />}
              label="이메일"
              name="email"
              onBlur={handleBlur}
              onChange={handleTextChange}
              placeholder="email@example.com"
              required
              type="email"
              value={values.email}
            />

            <div className="grid gap-5 sm:grid-cols-2">
              <Input
                autoComplete="new-password"
                errorMessage={errors.password}
                icon={<Lock className="h-4 w-4" aria-hidden />}
                label="비밀번호"
                minLength={8}
                name="password"
                onBlur={handleBlur}
                onChange={handleTextChange}
                placeholder="8자 이상 입력해 주세요"
                required
                type="password"
                value={values.password}
              />
              <Input
                autoComplete="new-password"
                errorMessage={errors.passwordConfirm}
                icon={<Lock className="h-4 w-4" aria-hidden />}
                label="비밀번호 확인"
                minLength={8}
                name="passwordConfirm"
                onBlur={handleBlur}
                onChange={handleTextChange}
                placeholder="비밀번호를 다시 입력해 주세요"
                required
                type="password"
                value={values.passwordConfirm}
              />
            </div>

            <fieldset aria-describedby={errors.role ? 'signup-role-error' : undefined}>
              <legend className="text-sm font-medium text-ink-700">사용자 유형</legend>
              <div className="mt-2 grid gap-3 sm:grid-cols-3">
                {roleOptions.map((option) => (
                  <label
                    key={option.value}
                    className={cn(
                      'cursor-pointer rounded-app border p-4 transition',
                      values.role === option.value
                        ? 'border-leaf-500 bg-leaf-50 ring-2 ring-leaf-100'
                        : 'border-leaf-100 hover:border-leaf-300',
                    )}
                  >
                    <input
                      checked={values.role === option.value}
                      className="sr-only"
                      name="role"
                      onChange={() => selectRole(option.value)}
                      type="radio"
                      value={option.value}
                    />
                    <span className="block text-sm font-black text-ink-900">
                      {option.label}
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-slate-500">
                      {option.description}
                    </span>
                  </label>
                ))}
              </div>
              {errors.role ? (
                <p
                  className="mt-1.5 text-xs font-medium text-red-600"
                  id="signup-role-error"
                  role="alert"
                >
                  {errors.role}
                </p>
              ) : null}
            </fieldset>

            <Button
              className="mt-1 w-full"
              disabled={isSubmitting || hasErrors}
              type="submit"
            >
              {isSubmitting ? '가입 중...' : '회원가입'}
              <ArrowRight className="h-5 w-5" aria-hidden />
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-600">
            이미 계정이 있으신가요?{' '}
            <Link className="font-bold text-leaf-700" to={ROUTES.login}>
              로그인
            </Link>
          </p>
        </Card>
      </div>
    </PageContainer>
  );
}
