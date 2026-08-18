import { ImagePlus, X } from 'lucide-react';
import { ChangeEvent, useRef, useState } from 'react';

import { Button } from '@/components/common/Button';
import { RemoteImage } from '@/components/common/RemoteImage';
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_IMAGE_COUNT,
  MAX_IMAGE_SIZE_BYTES,
  deleteImage,
  isAcceptedImage,
  uploadImages,
} from '@/services/fileService';
import { formatNumber } from '@/utils/format';

interface SpaceImageUploaderProps {
  value: string[];
  onChange: (imageUrls: string[]) => void;
  // 상위 폼이 제출을 막았을 때 이 섹션에 표시할 문구입니다.
  requiredMessage?: string | null;
}

const MAX_IMAGE_SIZE_MB = MAX_IMAGE_SIZE_BYTES / 1024 / 1024;
const label = '공간 사진';

// 파일을 고르면 곧바로 업로드하고 서버가 돌려준 URL만 상위 폼에 넘깁니다.
// 이렇게 해야 다음 단계(수익 예측)로 넘어갔다 돌아와도 선택한 파일이 그대로 남습니다.
export function SpaceImageUploader({
  value,
  onChange,
  requiredMessage,
}: SpaceImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [removingUrl, setRemovingUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const remaining = MAX_IMAGE_COUNT - value.length;
  // 업로드 중 발생한 오류를 먼저 보여주고, 없으면 상위 폼의 필수 안내를 보여줍니다.
  const message = error ?? requiredMessage ?? null;

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    // 같은 파일을 다시 고를 수 있도록 input 값을 즉시 비웁니다.
    event.target.value = '';
    if (selected.length === 0) return;

    if (selected.length > remaining) {
      setError(
        `${label}은 ${formatNumber(MAX_IMAGE_COUNT)}장까지 등록할 수 있습니다. ${formatNumber(remaining)}장 더 선택할 수 있습니다.`,
      );
      return;
    }
    if (selected.some((file) => !isAcceptedImage(file))) {
      setError('jpg, png, webp, gif 이미지만 등록할 수 있습니다.');
      return;
    }
    if (selected.some((file) => file.size > MAX_IMAGE_SIZE_BYTES)) {
      setError(`파일 한 장의 크기는 ${formatNumber(MAX_IMAGE_SIZE_MB)}MB 이하여야 합니다.`);
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

  // 화면 배열에서 빼는 것만으로는 서버에 파일이 남으므로 삭제 요청까지 보낸 뒤 목록을 갱신합니다.
  async function handleRemove(imageUrl: string) {
    setRemovingUrl(imageUrl);
    setError(null);
    try {
      await deleteImage(imageUrl);
      onChange(value.filter((item) => item !== imageUrl));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '사진을 삭제하지 못했습니다.');
    } finally {
      setRemovingUrl(null);
    }
  }

  return (
    <div>
      <input
        accept={ACCEPTED_IMAGE_TYPES}
        aria-label={`${label} 선택`}
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
        {isUploading ? '올리는 중...' : `${label} 선택`}
      </Button>
      <p className="mt-2 text-xs font-medium text-content-subtle">
        jpg · png · webp · gif, 한 장당 {formatNumber(MAX_IMAGE_SIZE_MB)}MB 이하 ·{' '}
        {label} {formatNumber(value.length)}/{formatNumber(MAX_IMAGE_COUNT)}장 등록됨
      </p>

      {message ? (
        <p className="mt-2 text-xs font-medium text-feedback-danger" role="alert">
          {message}
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
                alt={`등록한 ${label} ${formatNumber(index + 1)}`}
                className="h-28 w-full object-cover"
                src={imageUrl}
              />
              {/* 첫 장이 목록 카드의 대표 이미지가 되므로 순서를 눈으로 알 수 있게 표시합니다. */}
              {index === 0 ? (
                <span className="absolute left-2 top-2 rounded-full bg-action px-2 py-1 text-xs font-semibold text-content-inverse">
                  대표
                </span>
              ) : null}
              <button
                aria-label={`${label} ${formatNumber(index + 1)} 삭제`}
                className="absolute right-1 top-1 flex h-11 w-11 items-center justify-center rounded-full text-content-inverse transition duration-ui hover:bg-content/20 disabled:opacity-50"
                disabled={removingUrl === imageUrl}
                onClick={() => void handleRemove(imageUrl)}
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
