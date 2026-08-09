import { useEffect, useState } from 'react';

import { ImageFallback } from '@/components/common/ImageFallback';

interface RemoteImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  decorativeFallback?: boolean;
}

// 이미지가 없거나 외부 URL 로드에 실패해도 깨진 이미지 아이콘을 노출하지 않습니다.
export function RemoteImage({
  src,
  alt,
  className,
  decorativeFallback,
}: RemoteImageProps) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (!src || hasError) {
    return (
      <ImageFallback alt={alt} className={className} decorative={decorativeFallback} />
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
