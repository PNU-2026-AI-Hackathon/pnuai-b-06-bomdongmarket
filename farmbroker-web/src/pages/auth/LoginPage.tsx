import { ArrowRight, Lock, Mail } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

import { resolveReturnLocation } from '@/auth/redirect';
import { useAuth } from '@/auth/authContext';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { Input } from '@/components/common/Input';
import { PageContainer } from '@/components/layout/PageContainer';
import { ROUTES } from '@/constants/routes';
import { useLoginForm } from '@/pages/auth/hooks/useLoginForm';

// 로그인 후 서버에서 사용자 권한을 확인하는 이메일 로그인 화면입니다.
export function LoginPage() {
  const { login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const {
    values,
    errors,
    hasErrors,
    isSubmitting,
    handleBlur,
    handleChange,
    handleSubmit,
  } = useLoginForm(() => {
    login();
    navigate(resolveReturnLocation(location.state, ROUTES.dashboard), { replace: true });
  });

  return (
    <PageContainer
      className="flex min-h-[calc(100vh-4rem)] items-center justify-center pb-28 pt-10 sm:pt-14 lg:py-16"
      narrow
    >
      <div className="w-full max-w-md">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-soil-500">
            Welcome back
          </p>
          <h1 className="mt-2 text-3xl font-black text-ink-900">봄동마켓 로그인</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            계정 정보를 입력하면 확인된 권한으로 서비스를 이용할 수 있습니다.
          </p>
        </div>

        <Card className="mt-6 p-6 shadow-lift sm:p-8">
          <form className="grid gap-5" noValidate onSubmit={handleSubmit}>
            <Input
              autoComplete="email"
              errorMessage={errors.email}
              icon={<Mail className="h-4 w-4" aria-hidden />}
              label="이메일"
              name="email"
              onBlur={handleBlur}
              onChange={handleChange}
              placeholder="email@example.com"
              required
              type="email"
              value={values.email}
            />
            <Input
              autoComplete="current-password"
              errorMessage={errors.password}
              icon={<Lock className="h-4 w-4" aria-hidden />}
              label="비밀번호"
              minLength={8}
              name="password"
              onBlur={handleBlur}
              onChange={handleChange}
              placeholder="비밀번호를 입력해 주세요"
              required
              type="password"
              value={values.password}
            />
            <Button
              className="mt-1 w-full"
              disabled={isSubmitting || hasErrors}
              type="submit"
            >
              {isSubmitting ? '로그인 중...' : '로그인'}
              <ArrowRight className="h-5 w-5" aria-hidden />
            </Button>
          </form>
          <p className="mt-5 text-center text-sm text-slate-600">
            봄동마켓이 처음이신가요?{' '}
            <button
              className="rounded-sm font-bold text-leaf-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-leaf-500 focus-visible:ring-offset-2"
              type="button"
            >
              회원가입
            </button>
          </p>
        </Card>
      </div>
    </PageContainer>
  );
}
