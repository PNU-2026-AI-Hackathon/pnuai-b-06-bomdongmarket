import type { InputHTMLAttributes, ReactNode } from 'react';

import { cn } from '@/utils/cn';

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
  const inputId = id ?? props.name;
  const messageId =
    inputId && (errorMessage || helperText) ? `${inputId}-message` : undefined;
  const describedBy =
    [props['aria-describedby'], messageId].filter(Boolean).join(' ') || undefined;

  return (
    <label className="block text-sm font-medium text-ink-700" htmlFor={inputId}>
      {label ? <span className="mb-2 block">{label}</span> : null}
      <span className="relative block">
        {icon ? (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </span>
        ) : null}
        <input
          {...props}
          id={inputId}
          aria-describedby={describedBy}
          aria-invalid={errorMessage ? true : props['aria-invalid']}
          className={cn(
            'min-h-11 w-full rounded-app border border-leaf-100 bg-white px-3 text-sm text-ink-900 transition placeholder:text-slate-400 hover:border-leaf-300 focus:border-leaf-500 focus:outline-none focus:ring-2 focus:ring-leaf-200 disabled:cursor-not-allowed disabled:bg-slate-100',
            icon && 'pl-10',
            errorMessage &&
              'border-red-400 hover:border-red-500 focus:border-red-500 focus:ring-red-100',
            className,
          )}
        />
      </span>
      {errorMessage ? (
        <span
          className="mt-1.5 block text-xs font-medium text-red-600"
          id={messageId}
          role="alert"
        >
          {errorMessage}
        </span>
      ) : helperText ? (
        <span className="mt-1.5 block text-xs font-normal text-slate-500" id={messageId}>
          {helperText}
        </span>
      ) : null}
    </label>
  );
}
