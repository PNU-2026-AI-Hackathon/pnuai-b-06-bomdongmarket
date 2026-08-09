import { useId, type TextareaHTMLAttributes } from 'react';

import { fieldControlStyles } from '@/components/common/fieldStyles';
import { cn } from '@/utils/cn';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  errorMessage?: string;
}

// 여러 줄 메모와 신청 메시지에 Input과 같은 label, helper/error, focus 계약을 제공합니다.
export function Textarea({
  label,
  helperText,
  errorMessage,
  className,
  id,
  ...props
}: TextareaProps) {
  const generatedId = useId();
  const textareaId = id ?? props.name ?? generatedId;
  const messageId = errorMessage || helperText ? `${textareaId}-message` : undefined;
  const describedBy =
    [props['aria-describedby'], messageId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="block text-sm font-medium text-content-muted">
      {label ? (
        <label className="mb-2 block" htmlFor={textareaId}>
          {label}
        </label>
      ) : null}
      <textarea
        {...props}
        id={textareaId}
        aria-describedby={describedBy}
        aria-invalid={errorMessage ? true : props['aria-invalid']}
        className={fieldControlStyles({
          className: cn('py-3', className),
          invalid: Boolean(errorMessage),
        })}
      />
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
