import { useId, type InputHTMLAttributes, type ReactNode } from 'react';

import { fieldControlStyles } from '@/components/common/fieldStyles';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: ReactNode;
  helperText?: string;
  errorMessage?: string;
  // 라벨 옆에 빨간 별을 붙여 필수 입력임을 알립니다.
  // readOnly 주소 칸처럼 브라우저 required 검증이 걸리지 않는 칸에도 붙일 수 있어야 해 required와 분리했습니다.
  requiredMark?: boolean;
}

// 검색, 필터, 등록 폼에서 재사용하는 라벨 포함 입력 컴포넌트입니다.
export function Input({
  label,
  icon,
  helperText,
  errorMessage,
  requiredMark,
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
    <div className="block text-sm font-medium text-content-muted">
      {label ? (
        // 별표는 label 밖에 둡니다. 안에 넣으면 칸의 접근성 이름이 '공간 이름 *'으로 바뀝니다.
        <span className="mb-2 flex items-center gap-1">
          <label htmlFor={inputId}>{label}</label>
          {requiredMark ? (
            <span aria-hidden className="text-feedback-danger">
              *
            </span>
          ) : null}
        </span>
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
    </div>
  );
}
