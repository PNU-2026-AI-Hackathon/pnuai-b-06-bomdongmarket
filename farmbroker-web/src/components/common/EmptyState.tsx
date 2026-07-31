import { SearchX } from 'lucide-react';

import { Button } from '@/components/common/Button';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

// 검색 결과 없음이나 아직 등록된 항목이 없는 상태를 명확하게 보여줍니다.
export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="rounded-app border border-dashed border-leaf-200 bg-white px-6 py-10 text-center">
      <SearchX className="mx-auto h-9 w-9 text-leaf-400" aria-hidden />
      <h2 className="mt-4 text-lg font-bold text-ink-900">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">{description}</p>
      {actionLabel && onAction ? (
        <Button className="mt-5" onClick={onAction} variant="outline">
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
