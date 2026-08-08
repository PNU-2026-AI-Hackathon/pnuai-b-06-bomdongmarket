import { useId, type InputHTMLAttributes, type ReactNode } from 'react';

import { fieldControlStyles } from '@/components/common/fieldStyles';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: ReactNode;
  helperText?: string;
  errorMessage?: string;
}

// 검색, 필터, 등록 폼에서 재사용하는 라벨 포함 입력 컴포넌트입니다.
export function Input({
  label,
  icon,
  helperText,
  errorMessage,
  className,
  id,
  ...props
}: InputProps) {
  const generatedId = useId();
  const inputId = id ?? props.name ?? generatedId;
  const messageId = errorMessage || helperText ? `${inputId}-message` : undefined;
  const describedBy =
    [props['aria-describedby'], messageId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="block text-sm font-semibold text-content-muted">
      {label ? (
        <label className="mb-2 block" htmlFor={inputId}>
          {label}
        </label>
      ) : null}
      <span className="relative block">
        {icon ? (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-content-subtle">
            {icon}
          </span>
        ) : null}
        <input
          {...props}
          id={inputId}
          aria-describedby={describedBy}
          aria-invalid={errorMessage ? true : props['aria-invalid']}
          className={fieldControlStyles({
            className,
            hasIcon: Boolean(icon),
            invalid: Boolean(errorMessage),
          })}
        />
      </span>
      {errorMessage ? (
        <span
          className="mt-1.5 block text-sm font-medium text-feedback-danger"
          id={messageId}
          role="alert"
        >
          {errorMessage}
        </span>
      ) : helperText ? (
        <span
          className="mt-1.5 block text-sm font-normal text-content-subtle"
          id={messageId}
        >
          {helperText}
        </span>
      ) : null}
    </div>
  );
}
