import { useState, type FormEvent } from 'react';

import { ApiError } from '@/api/client';
import { useAuth } from '@/auth/authContext';

interface ProfileFields {
  nickname: string;
  currentPassword: string;
  newPassword: string;
  newPasswordConfirmation: string;
}

type ProfileFieldErrors = Partial<Record<keyof ProfileFields, string>>;

export function useProfileEdit() {
  const { updateUser, user } = useAuth();
  const [fields, setFields] = useState<ProfileFields>({
    nickname: user?.nickname ?? '',
    currentPassword: '',
    newPassword: '',
    newPasswordConfirmation: '',
  });
  const [fieldErrors, setFieldErrors] = useState<ProfileFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  function updateField(field: keyof ProfileFields, value: string) {
    setFields((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setFormError(null);
    setSuccessMessage(null);
  }

  function validate() {
    const errors: ProfileFieldErrors = {};
    const isChangingPassword = Boolean(
      fields.currentPassword || fields.newPassword || fields.newPasswordConfirmation,
    );

    if (!fields.nickname.trim()) {
      errors.nickname = '닉네임을 입력해 주세요.';
    }

    if (isChangingPassword) {
      if (!fields.currentPassword) {
        errors.currentPassword = '현재 비밀번호를 입력해 주세요.';
      }
      if (fields.newPassword.length < 8) {
        errors.newPassword = '새 비밀번호는 8자 이상이어야 합니다.';
      }
      if (!fields.newPasswordConfirmation) {
        errors.newPasswordConfirmation = '새 비밀번호를 한 번 더 입력해 주세요.';
      } else if (fields.newPassword !== fields.newPasswordConfirmation) {
        errors.newPasswordConfirmation = '새 비밀번호가 일치하지 않습니다.';
      }
    }

    setFieldErrors(errors);
    return { isChangingPassword, isValid: Object.keys(errors).length === 0 };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;

    setFormError(null);
    setSuccessMessage(null);
    const { isChangingPassword, isValid } = validate();
    if (!isValid) return;

    setIsSaving(true);
    try {
      await updateUser({
        nickname: fields.nickname.trim(),
        ...(isChangingPassword
          ? {
              currentPassword: fields.currentPassword,
              newPassword: fields.newPassword,
            }
          : {}),
      });
      setFields((current) => ({
        ...current,
        nickname: current.nickname.trim(),
        currentPassword: '',
        newPassword: '',
        newPasswordConfirmation: '',
      }));
      setSuccessMessage('계정 정보가 저장되었습니다. 변경된 정보가 바로 반영되었습니다.');
    } catch (error) {
      if (error instanceof ApiError && error.errorCode === 'INVALID_CURRENT_PASSWORD') {
        setFieldErrors((current) => ({
          ...current,
          currentPassword: '현재 비밀번호가 일치하지 않습니다.',
        }));
      } else {
        setFormError('계정 정보를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.');
      }
    } finally {
      setIsSaving(false);
    }
  }

  return {
    fields,
    fieldErrors,
    formError,
    handleSubmit,
    isSaving,
    successMessage,
    updateField,
    user,
  };
}
