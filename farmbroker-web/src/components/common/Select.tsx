import { useId, type ReactNode, type SelectHTMLAttributes } from 'react';

import { fieldControlStyles } from '@/components/common/fieldStyles';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  icon?: ReactNode;
  helperText?: string;
  errorMessage?: string;
}

// 입력과 동일한 label, helper/error, focus 계약을 사용하는 공통 선택 필드입니다.
export function Select({
  children,
  label,
  icon,
  helperText,
  errorMessage,
  className,
  id,
  ...props
}: SelectProps) {
  const generatedId = useId();
  const selectId = id ?? props.name ?? generatedId;
  const messageId = errorMessage || helperText ? `${selectId}-message` : undefined;
  const describedBy =
    [props['aria-describedby'], messageId].filter(Boolean).join(' ') || undefined;

  return (
    <label className="block text-sm font-medium text-content-muted" htmlFor={selectId}>
      {label ? <span className="mb-2 block">{label}</span> : null}
      <span className="relative block">
        {icon ? (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-content-subtle">
            {icon}
          </span>
        ) : null}
        <select
          {...props}
          id={selectId}
          aria-describedby={describedBy}
          aria-invalid={errorMessage ? true : props['aria-invalid']}
          className={fieldControlStyles({
            className,
            hasIcon: Boolean(icon),
            invalid: Boolean(errorMessage),
          })}
        >
          {children}
        </select>
      </span>
      {errorMessage ? (
        <span
          className="mt-1.5 block text-xs font-medium text-feedback-danger"
          id={messageId}
          role="alert"
        >
          {errorMessage}
        </span>
      ) : helperText ? (
        <span
          className="mt-1.5 block text-xs font-normal text-content-subtle"
          id={messageId}
        >
          {helperText}
        </span>
      ) : null}
    </label>
  );
}
