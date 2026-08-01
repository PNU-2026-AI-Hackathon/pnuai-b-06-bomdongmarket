import type { ButtonHTMLAttributes, ReactNode } from 'react';

import {
  buttonStyles,
  type ButtonSize,
  type ButtonVariant,
} from '@/components/common/buttonStyles';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
}

// 주요 CTA와 폼 액션에서 사용하는 공통 버튼입니다.
export function Button({
  children,
  className,
  variant = 'primary',
  size = 'md',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button type={type} className={buttonStyles({ variant, size, className })} {...props}>
      {children}
    </button>
  );
}
