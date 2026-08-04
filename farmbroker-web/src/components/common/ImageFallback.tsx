import { ImageOff } from 'lucide-react';

import { cn } from '@/utils/cn';

interface ImageFallbackProps {
  alt: string;
  className?: string;
  decorative?: boolean;
}

// 등록 이미지가 없거나 불러오지 못했을 때 일관된 기본 시각을 제공합니다.
export function ImageFallback({
  alt,
  className,
  decorative = false,
}: ImageFallbackProps) {
  return (
    <div
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : `${alt} 이미지 없음`}
      className={cn(
        'flex flex-col items-center justify-center gap-2 bg-surface-subtle text-content-muted',
        className,
      )}
      role={decorative ? undefined : 'img'}
    >
      <ImageOff className="h-7 w-7" aria-hidden />
      {!decorative ? (
        <span className="text-xs font-semibold">등록된 이미지 없음</span>
      ) : null}
    </div>
  );
}
