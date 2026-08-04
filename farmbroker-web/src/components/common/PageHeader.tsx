import type { ReactNode } from 'react';

import { cn } from '@/utils/cn';

type PageHeaderAlign = 'left' | 'center';
type PageHeaderActionBreakpoint = 'sm' | 'lg';

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
  align?: PageHeaderAlign;
  actionBreakpoint?: PageHeaderActionBreakpoint;
}

const actionLayouts: Record<PageHeaderActionBreakpoint, string> = {
  sm: 'sm:flex-row sm:items-end',
  lg: 'lg:flex-row lg:items-end',
};

const actionWidths: Record<PageHeaderActionBreakpoint, string> = {
  sm: 'sm:w-auto',
  lg: 'lg:w-auto',
};

// 목록·폼 화면에서 반복되는 eyebrow, h1, 설명, 우측 액션의 계층을 통일합니다.
export function PageHeader({
  eyebrow,
  title,
  description,
  action,
  align = 'left',
  actionBreakpoint = 'sm',
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col justify-between gap-4',
        align === 'center'
          ? 'items-center text-center'
          : actionLayouts[actionBreakpoint],
      )}
    >
      <div>
        <p className="text-eyebrow uppercase text-accent">{eyebrow}</p>
        <h1 className="mt-2 text-page-title text-content sm:text-page-title-lg">
          {title}
        </h1>
        {description ? (
          <p
            className={cn(
              'mt-3 max-w-2xl text-body-sm text-content-muted',
              align === 'center' && 'mx-auto',
            )}
          >
            {description}
          </p>
        ) : null}
      </div>
      {action ? (
        <div
          className={cn(
            'w-full shrink-0',
            align === 'center' ? 'sm:w-auto' : actionWidths[actionBreakpoint],
          )}
        >
          {action}
        </div>
      ) : null}
    </div>
  );
}

export type { PageHeaderActionBreakpoint, PageHeaderAlign };
