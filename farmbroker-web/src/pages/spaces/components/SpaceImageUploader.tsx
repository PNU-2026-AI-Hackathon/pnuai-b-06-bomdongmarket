import { ImagePlus, X } from 'lucide-react';
import { ChangeEvent, useRef, useState } from 'react';

import { Button } from '@/components/common/Button';
import { RemoteImage } from '@/components/common/RemoteImage';
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_IMAGE_COUNT,
  MAX_IMAGE_SIZE_BYTES,
  isAcceptedImage,
  uploadImages,
} from '@/services/fileService';
import { formatNumber } from '@/utils/format';

interface SpaceImageUploaderProps {
  value: string[];
  onChange: (imageUrls: string[]) => void;
}

const MAX_IMAGE_SIZE_MB = MAX_IMAGE_SIZE_BYTES / 1024 / 1024;

// 파일을 고르면 곧바로 업로드하고 서버가 돌려준 URL만 상위 폼에 넘깁니다.
// 이렇게 해야 다음 단계(수익 예측)로 넘어갔다 돌아와도 선택한 사진이 그대로 남습니다.
export function SpaceImageUploader({ value, onChange }: SpaceImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remaining = MAX_IMAGE_COUNT - value.length;

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    // 같은 파일을 다시 고를 수 있도록 input 값을 즉시 비웁니다.
    event.target.value = '';
    if (selected.length === 0) return;

    if (selected.length > remaining) {
      setError(
        `사진은 ${formatNumber(MAX_IMAGE_COUNT)}장까지 등록할 수 있습니다. ${formatNumber(remaining)}장 더 선택할 수 있습니다.`,
      );
      return;
    }
    if (selected.some((file) => !isAcceptedImage(file))) {
      setError('jpg, png, webp, gif 이미지만 등록할 수 있습니다.');
      return;
    }
    if (selected.some((file) => file.size > MAX_IMAGE_SIZE_BYTES)) {
      setError(`사진 한 장의 크기는 ${formatNumber(MAX_IMAGE_SIZE_MB)}MB 이하여야 합니다.`);
      return;
    }

    setIsUploading(true);
    setError(null);
    try {
      const uploaded = await uploadImages(selected);
      onChange([...value, ...uploaded.map((file) => file.url)]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '사진을 올리지 못했습니다.');
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div>
      <input
        accept={ACCEPTED_IMAGE_TYPES}
        aria-label="공간 사진 선택"
        className="sr-only"
        multiple
        onChange={handleFileChange}
        ref={inputRef}
        type="file"
      />

      <Button
        disabled={isUploading || remaining === 0}
        onClick={() => inputRef.current?.click()}
        variant="outline"
      >
        <ImagePlus className="h-5 w-5" aria-hidden />
        {isUploading ? '올리는 중...' : '사진 선택'}
      </Button>
      <p className="mt-2 text-xs font-medium text-content-subtle">
        jpg · png · webp · gif, 한 장당 {formatNumber(MAX_IMAGE_SIZE_MB)}MB 이하 ·{' '}
        {formatNumber(value.length)}/{formatNumber(MAX_IMAGE_COUNT)}장 등록됨
      </p>

      {error ? (
        <p className="mt-2 text-xs font-medium text-feedback-danger" role="alert">
          {error}
        </p>
      ) : null}

      {value.length > 0 ? (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {value.map((imageUrl, index) => (
            <li
              key={imageUrl}
              className="relative overflow-hidden rounded-app border border-line"
            >
              <RemoteImage
                alt={`등록한 공간 사진 ${formatNumber(index + 1)}`}
                className="h-28 w-full object-cover"
                src={imageUrl}
              />
              {index === 0 ? (
                <span className="absolute left-2 top-2 rounded-full bg-action px-2 py-1 text-xs font-semibold text-content-inverse">
                  대표
                </span>
              ) : null}
              <button
                aria-label={`공간 사진 ${formatNumber(index + 1)} 삭제`}
                className="absolute right-1 top-1 flex h-11 w-11 items-center justify-center rounded-full text-content-inverse transition duration-ui hover:bg-content/20"
                onClick={() => onChange(value.filter((item) => item !== imageUrl))}
                type="button"
              >
                <X className="h-5 w-5 drop-shadow" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
