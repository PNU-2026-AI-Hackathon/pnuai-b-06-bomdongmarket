import type { ComponentPropsWithRef, ReactNode } from 'react';

import {
  buttonStyles,
  type ButtonSize,
  type ButtonVariant,
} from '@/components/common/buttonStyles';

// React 19에서 ref는 일반 prop이라 forwardRef 없이 그대로 내려보냅니다.
// (ConfirmDialog가 열릴 때 확인 버튼으로 포커스를 옮기는 데 씁니다.)
interface ButtonProps extends ComponentPropsWithRef<'button'> {
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
