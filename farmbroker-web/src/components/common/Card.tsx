import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from '@/utils/cn';

type CardVariant = 'default' | 'interactive' | 'subtle';
type CardPadding = 'none' | 'sm' | 'md' | 'lg';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: CardVariant;
  padding?: CardPadding;
}

const variants: Record<CardVariant, string> = {
  default: 'border-line bg-surface shadow-card',
  interactive:
    'border-line bg-surface shadow-card transition duration-ui hover:-translate-y-0.5 hover:border-line-strong hover:shadow-lift',
  subtle: 'border-line bg-surface-subtle shadow-none',
};

const paddings: Record<CardPadding, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5',
};

// 목록 카드와 요약 패널처럼 반복되는 정보 덩어리를 담는 얕은 컨테이너입니다.
export function Card({
  children,
  className,
  padding = 'none',
  variant = 'default',
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-app border',
        variants[variant],
        paddings[padding],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export type { CardPadding, CardVariant };
