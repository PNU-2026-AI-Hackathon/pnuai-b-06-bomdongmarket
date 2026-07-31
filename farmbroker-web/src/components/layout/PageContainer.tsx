import type { ReactNode } from 'react';

import { cn } from '@/utils/cn';

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  narrow?: boolean;
}

// 각 페이지의 최대 폭과 모바일 하단 네비게이션 여백을 맞춥니다.
export function PageContainer({
  children,
  className,
  narrow = false,
}: PageContainerProps) {
  return (
    <main
      className={cn(
        'mx-auto w-full px-4 pb-24 pt-5 sm:px-6 lg:pb-10 lg:pt-8',
        narrow ? 'max-w-4xl' : 'max-w-7xl',
        className,
      )}
    >
      {children}
    </main>
  );
}
