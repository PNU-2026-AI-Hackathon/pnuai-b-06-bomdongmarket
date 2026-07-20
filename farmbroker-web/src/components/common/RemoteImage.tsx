import { ImageOff } from 'lucide-react';
import { useEffect, useState } from 'react';

import { cn } from '@/utils/cn';

interface RemoteImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
}

// 이미지가 없거나 외부 URL 로드에 실패해도 깨진 이미지 아이콘을 노출하지 않습니다.
export function RemoteImage({ src, alt, className }: RemoteImageProps) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (!src || hasError) {
    return (
      <div
        aria-label={`${alt} 이미지 없음`}
        className={cn(
          'flex flex-col items-center justify-center gap-2 bg-leaf-50 text-leaf-700',
          className,
        )}
        role="img"
      >
        <ImageOff className="h-7 w-7" aria-hidden />
        <span className="text-xs font-semibold">등록된 이미지 없음</span>
      </div>
    );
  }

  return (
    <img
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => setHasError(true)}
      src={src}
    />
  );
}
