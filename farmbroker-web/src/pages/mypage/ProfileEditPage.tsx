import { ArrowLeft, LockKeyhole } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/common/Button';
import { buttonStyles } from '@/components/common/buttonStyles';
import { Card } from '@/components/common/Card';
import { Input } from '@/components/common/Input';
import { PageHeader } from '@/components/common/PageHeader';
import { PageContainer } from '@/components/layout/PageContainer';
import { ROUTES } from '@/constants/routes';
import { useProfileEdit } from '@/pages/mypage/hooks/useProfileEdit';

export function ProfileEditPage() {
  const {
    fields,
    fieldErrors,
    formError,
    handleSubmit,
    isSaving,
    successMessage,
    updateField,
    user,
  } = useProfileEdit();

  return (
    <PageContainer narrow>
      <PageHeader
        action={
          <Link className={buttonStyles({ variant: 'ghost' })} to={ROUTES.myPage}>
            <ArrowLeft className="h-4 w-4" aria-hidden />
            마이페이지로
          </Link>
        }
        description="이메일은 로그인 식별자로 유지하고, 닉네임과 비밀번호를 변경할 수 있습니다."
        eyebrow="Profile"
        title="계정 정보 수정"
      />

      <form className="mt-6" noValidate onSubmit={(event) => void handleSubmit(event)}>
        <Card padding="lg">
          {formError ? (
            <p
              className="mb-5 rounded-app bg-feedback-danger-soft p-3 text-sm font-semibold text-feedback-danger"
              role="alert"
            >
              {formError}
            </p>
          ) : null}
          {successMessage ? (
            <p
              className="mb-5 rounded-app bg-feedback-success-soft p-3 text-sm font-semibold text-feedback-success"
              role="status"
            >
              {successMessage}
            </p>
          ) : null}

          <div className="grid gap-5">
            <Input
              label="이메일"
              name="email"
              readOnly
              type="email"
              value={user?.email ?? ''}
              helperText="이메일 변경은 현재 지원하지 않습니다."
            />
            <Input
              autoComplete="nickname"
              errorMessage={fieldErrors.nickname}
              label="닉네임"
              name="nickname"
              onChange={(event) => updateField('nickname', event.target.value)}
              value={fields.nickname}
            />
          </div>

          <section aria-labelledby="password-change-title" className="mt-8 border-t border-line pt-6">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-app bg-action-soft text-action">
                <LockKeyhole className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <h2 className="font-bold text-content" id="password-change-title">
                  비밀번호 변경
                </h2>
                <p className="mt-1 text-sm text-content-muted">
                  변경하지 않으려면 아래 세 필드를 모두 비워 두세요.
                </p>
              </div>
            </div>
            <div className="mt-5 grid gap-5">
              <Input
                autoComplete="current-password"
                errorMessage={fieldErrors.currentPassword}
                label="현재 비밀번호"
                name="currentPassword"
                onChange={(event) => updateField('currentPassword', event.target.value)}
                type="password"
                value={fields.currentPassword}
              />
              <Input
                autoComplete="new-password"
                errorMessage={fieldErrors.newPassword}
                helperText="8자 이상 입력해 주세요."
                label="새 비밀번호"
                name="newPassword"
                onChange={(event) => updateField('newPassword', event.target.value)}
                type="password"
                value={fields.newPassword}
              />
              <Input
                autoComplete="new-password"
                errorMessage={fieldErrors.newPasswordConfirmation}
                label="새 비밀번호 확인"
                name="newPasswordConfirmation"
                onChange={(event) =>
                  updateField('newPasswordConfirmation', event.target.value)
                }
                type="password"
                value={fields.newPasswordConfirmation}
              />
            </div>
          </section>

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Link className={buttonStyles({ variant: 'outline' })} to={ROUTES.myPage}>
              취소
            </Link>
            <Button disabled={isSaving} type="submit">
              {isSaving ? '저장 중...' : '계정 정보 저장'}
            </Button>
          </div>
        </Card>
      </form>
    </PageContainer>
  );
}
