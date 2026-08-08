import { ImageOff } from 'lucide-react';

interface ProductImageProps {
  src: string | null;
  alt: string;
  // 이미지·placeholder 공통으로 적용할 크기/모양 클래스(h-44, aspect-[4/3] 등)
  className?: string;
}

// 상품 이미지는 사진 없이 등록될 수 있어(백엔드 imageUrl nullable) 깨진 <img> 대신 placeholder를 보여준다.
export function ProductImage({ src, alt, className }: ProductImageProps) {
  if (!src) {
    return (
      <div
        aria-label={`${alt} 이미지 없음`}
        className={`flex items-center justify-center bg-slate-100 text-slate-400 ${className ?? ''}`}
        role="img"
      >
        <ImageOff className="h-8 w-8" aria-hidden />
      </div>
    );
  }

  return <img alt={alt} className={className} src={src} />;
}
