import { useEffect, useState } from 'react';

import { RemoteImage } from '@/components/common/RemoteImage';

interface SpaceImageGalleryProps {
  title: string;
  imageUrls: string[];
}

// 상세 화면의 대표 이미지와 썸네일을 관리합니다.
export function SpaceImageGallery({ title, imageUrls }: SpaceImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(imageUrls[0]);

  useEffect(() => {
    setSelectedImage(imageUrls[0]);
  }, [imageUrls]);

  return (
    <div>
      <RemoteImage
        alt={title}
        className="aspect-[4/3] w-full rounded-app object-cover shadow-card"
        src={selectedImage}
      />
      {imageUrls.length > 1 ? (
        <div className="mt-3 grid grid-cols-4 gap-2">
          {imageUrls.map((imageUrl, index) => (
            <button
              key={`${imageUrl}-${index}`}
              aria-label={`이미지 ${index + 1} 보기`}
              className="overflow-hidden rounded-app border border-leaf-100 focus-visible:outline-leaf-500"
              onClick={() => setSelectedImage(imageUrl)}
              type="button"
            >
              <RemoteImage
                alt=""
                className="aspect-square w-full object-cover"
                decorativeFallback
                src={imageUrl}
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
