import type { ReactNode } from 'react';

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
}

// 목록·폼 화면에서 반복되는 eyebrow, h1, 설명, 우측 액션의 계층을 통일합니다.
export function PageHeader({ eyebrow, title, description, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <p className="text-eyebrow uppercase text-accent">{eyebrow}</p>
        <h1 className="mt-2 text-page-title text-content sm:text-page-title-lg">
          {title}
        </h1>
        {description ? (
          <p className="mt-3 max-w-2xl text-body-sm text-content-muted">{description}</p>
        ) : null}
      </div>
      {action ? <div className="w-full shrink-0 sm:w-auto">{action}</div> : null}
    </div>
  );
}
