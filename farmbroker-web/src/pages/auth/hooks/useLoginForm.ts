import type { ChangeEvent, FocusEvent, FormEvent } from 'react';
import { useState } from 'react';

interface LoginFormValues {
  email: string;
  password: string;
}

type LoginField = keyof LoginFormValues;
type LoginFormErrors = Partial<Record<LoginField, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateField(field: LoginField, value: string) {
  if (field === 'email') {
    if (!value.trim()) return '이메일을 입력해 주세요.';
    if (!EMAIL_PATTERN.test(value.trim())) return '올바른 이메일 형식을 입력해 주세요.';
    return undefined;
  }

  if (!value) return '비밀번호를 입력해 주세요.';
  if (value.length < 8) return '비밀번호는 8자 이상 입력해 주세요.';
  return undefined;
}

function validateForm(values: LoginFormValues) {
  const errors: LoginFormErrors = {};

  (Object.keys(values) as LoginField[]).forEach((field) => {
    const error = validateField(field, values[field]);
    if (error) errors[field] = error;
  });

  return errors;
}

export function useLoginForm(onSubmit: (values: LoginFormValues) => Promise<void>) {
  const [values, setValues] = useState<LoginFormValues>({ email: '', password: '' });
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const hasErrors = Object.values(errors).some(Boolean);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const field = event.currentTarget.name as LoginField;
    const value = event.currentTarget.value;

    setValues((current) => ({ ...current, [field]: value }));
    if (errors[field]) {
      setErrors((current) => ({ ...current, [field]: validateField(field, value) }));
    }
  }

  function handleBlur(event: FocusEvent<HTMLInputElement>) {
    const field = event.currentTarget.name as LoginField;
    const error = validateField(field, event.currentTarget.value);
    setErrors((current) => ({ ...current, [field]: error }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateForm(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    setSubmitError(null);
    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } catch (caught) {
      setSubmitError(caught instanceof Error ? caught.message : '로그인에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    values,
    errors,
    hasErrors,
    isSubmitting,
    submitError,
    handleBlur,
    handleChange,
    handleSubmit,
  };
}
