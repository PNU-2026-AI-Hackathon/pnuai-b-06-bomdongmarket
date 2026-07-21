import type { ChangeEvent, FocusEvent, FormEvent } from 'react';
import { useState } from 'react';

import type { SignupInput, UserRole } from '@/types/api';

interface SignupFormValues {
  nickname: string;
  email: string;
  password: string;
  passwordConfirm: string;
  role: UserRole | '';
}

type SignupTextField = 'nickname' | 'email' | 'password' | 'passwordConfirm';
type SignupField = SignupTextField | 'role';
type SignupFormErrors = Partial<Record<SignupField, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const initialValues: SignupFormValues = {
  nickname: '',
  email: '',
  password: '',
  passwordConfirm: '',
  role: '',
};

function validateTextField(
  field: SignupTextField,
  value: string,
  values: SignupFormValues,
) {
  const trimmedValue = value.trim();

  if (field === 'nickname') {
    if (!trimmedValue) return '이름 또는 닉네임을 입력해 주세요.';
    if (trimmedValue.length < 2 || trimmedValue.length > 30) {
      return '이름 또는 닉네임은 2자 이상 30자 이하로 입력해 주세요.';
    }
    return undefined;
  }

  if (field === 'email') {
    if (!trimmedValue) return '이메일을 입력해 주세요.';
    if (!EMAIL_PATTERN.test(trimmedValue)) return '올바른 이메일 형식을 입력해 주세요.';
    return undefined;
  }

  if (field === 'password') {
    if (!value) return '비밀번호를 입력해 주세요.';
    if (value.length < 8) return '비밀번호는 8자 이상 입력해 주세요.';
    return undefined;
  }

  if (field === 'passwordConfirm') {
    if (!value) return '비밀번호 확인을 입력해 주세요.';
    if (value !== values.password) return '비밀번호가 일치하지 않습니다.';
    return undefined;
  }

  return undefined;
}

function validateForm(values: SignupFormValues) {
  const errors: SignupFormErrors = {};
  const textFields: SignupTextField[] = [
    'nickname',
    'email',
    'password',
    'passwordConfirm',
  ];

  textFields.forEach((field) => {
    const error = validateTextField(field, values[field], values);
    if (error) errors[field] = error;
  });

  if (!values.role) errors.role = '사용자 유형을 선택해 주세요.';

  return errors;
}

export function useSignupForm(onSubmit: (values: SignupInput) => Promise<void>) {
  const [values, setValues] = useState<SignupFormValues>(initialValues);
  const [errors, setErrors] = useState<SignupFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const hasErrors = Object.values(errors).some(Boolean);

  function handleTextChange(event: ChangeEvent<HTMLInputElement>) {
    const field = event.currentTarget.name as SignupTextField;
    const value = event.currentTarget.value;
    const nextValues = { ...values, [field]: value };
    setValues(nextValues);

    if (errors[field]) {
      setErrors((current) => ({
        ...current,
        [field]: validateTextField(field, value, nextValues),
      }));
    }

    if (field === 'password' && errors.passwordConfirm && values.passwordConfirm) {
      setErrors((current) => ({
        ...current,
        passwordConfirm: validateTextField(
          'passwordConfirm',
          values.passwordConfirm,
          nextValues,
        ),
      }));
    }
  }

  function handleBlur(event: FocusEvent<HTMLInputElement>) {
    const field = event.currentTarget.name as SignupTextField;
    const error = validateTextField(field, event.currentTarget.value, values);
    setErrors((current) => ({ ...current, [field]: error }));
  }

  function selectRole(role: UserRole) {
    setValues((current) => ({ ...current, role }));
    setErrors((current) => ({ ...current, role: undefined }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateForm(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitError(null);
    setIsSubmitting(true);
    try {
      await onSubmit({
        nickname: values.nickname.trim(),
        email: values.email.trim(),
        password: values.password,
        role: values.role as UserRole,
      });
    } catch (caught) {
      setSubmitError(
        caught instanceof Error ? caught.message : '회원가입에 실패했습니다.',
      );
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
    handleTextChange,
    handleBlur,
    selectRole,
    handleSubmit,
  };
}
