import { AlertTriangle } from 'lucide-react';

import { Button } from '@/components/common/Button';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

// API 연결 실패나 mock 처리 예외를 화면 안에서 복구 가능한 상태로 표시합니다.
export function ErrorState({
  title = '문제가 발생했습니다',
  message,
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="rounded-app border border-red-100 bg-red-50 px-6 py-8 text-center text-red-900">
      <AlertTriangle className="mx-auto h-8 w-8" aria-hidden />
      <h2 className="mt-3 text-lg font-bold">{title}</h2>
      <p className="mt-2 text-sm">{message}</p>
      {onRetry ? (
        <Button className="mt-5" onClick={onRetry} variant="danger">
          다시 시도
        </Button>
      ) : null}
    </div>
  );
}
