import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from '@/utils/cn';

type BadgeTone = 'green' | 'yellow' | 'blue' | 'slate' | 'red';

const tones: Record<BadgeTone, string> = {
  green: 'bg-leaf-100 text-leaf-800',
  yellow: 'bg-soil-100 text-soil-700',
  blue: 'bg-skyfarm-50 text-skyfarm-500',
  slate: 'bg-slate-100 text-slate-700',
  red: 'bg-red-100 text-red-700',
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  tone?: BadgeTone;
}

// 상태, 신선도, 권한처럼 짧은 의미 표시를 통일합니다.
export function Badge({ children, className, tone = 'green', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold',
        tones[tone],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
