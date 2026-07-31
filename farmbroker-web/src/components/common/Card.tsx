import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from '@/utils/cn';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

// 목록 카드와 요약 패널처럼 반복되는 정보 덩어리를 담는 얕은 컨테이너입니다.
export function Card({ children, className, ...props }: CardProps) {
  return (
    <div
      className={cn('rounded-app border border-leaf-100 bg-white shadow-card', className)}
      {...props}
    >
      {children}
    </div>
  );
}
