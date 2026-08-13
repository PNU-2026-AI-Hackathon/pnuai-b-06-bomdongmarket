import { ImagePlus, Loader2, X } from 'lucide-react';
import { useRef, useState, type ChangeEvent, type DragEvent } from 'react';

import { RemoteImage } from '@/components/common/RemoteImage';
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_IMAGE_SIZE_BYTES,
  isAcceptedImage,
  uploadImages,
} from '@/services/fileService';
import { formatNumber } from '@/utils/format';

interface ProductImageUploaderProps {
  value: string;
  onChange: (imageUrl: string) => void;
  onDiscard: (url: string) => void;
}

const MAX_IMAGE_SIZE_MB = MAX_IMAGE_SIZE_BYTES / 1024 / 1024;

// 상품 대표 사진을 로컬 파일에서 바로 올립니다.
// 공간 등록(SpaceImageUploader)과 같은 fileService를 쓰지만, 상품은 imageUrl이 한 장이라
// 여러 장 배열 대신 단일 문자열을 주고받고 새 파일을 고르면 이전 사진을 교체합니다.
export function ProductImageUploader({ value, onChange, onDiscard }: ProductImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    if (!isAcceptedImage(file)) {
      setError('jpg, png, webp, gif 이미지만 올릴 수 있습니다.');
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setError(`파일 크기는 ${formatNumber(MAX_IMAGE_SIZE_MB)}MB 이하여야 합니다.`);
      return;
    }

    setIsUploading(true);
    setError(null);
    try {
      const [uploaded] = await uploadImages([file]);
      if (value) onDiscard(value);
      onChange(uploaded.url);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '사진을 올리지 못했습니다.');
    } finally {
      setIsUploading(false);
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // 같은 파일을 다시 고를 수 있도록 input 값을 즉시 비웁니다.
    event.target.value = '';
    if (file) void upload(file);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) void upload(file);
  }

  function handleRemove() {
    if (value) onDiscard(value);
    onChange('');
    setError(null);
  }

  return (
    <div>
      <input
        accept={ACCEPTED_IMAGE_TYPES}
        aria-label="대표 사진 선택"
        className="sr-only"
        onChange={handleFileChange}
        ref={inputRef}
        type="file"
      />

      {/* 미리보기는 4:3이라 폭을 묶어 두지 않으면 넓은 화면에서 한 화면을 다 덮습니다. */}
      {value ? (
        <div className="relative max-w-sm overflow-hidden rounded-app border border-leaf-100">
          <RemoteImage
            alt="등록한 대표 사진"
            className="aspect-[4/3] w-full object-cover"
            src={value}
          />
          <button
            aria-label="대표 사진 삭제"
            className="absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-full bg-ink-900/50 text-white transition duration-ui hover:bg-ink-900/70"
            onClick={handleRemove}
            type="button"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
          <button
            className="w-full bg-white py-3 text-base font-semibold text-leaf-700 transition duration-ui hover:bg-leaf-50 disabled:opacity-60"
            disabled={isUploading}
            onClick={() => inputRef.current?.click()}
            type="button"
          >
            {isUploading ? '올리는 중...' : '다른 사진으로 바꾸기'}
          </button>
        </div>
      ) : (
        // 버튼이 아니라 넓은 영역 전체를 누를 수 있게 해야 모바일에서 사진 고르기가 쉽습니다.
        <div
          className={[
            'flex flex-col items-center justify-center rounded-app border-2 border-dashed px-4 py-10 text-center transition duration-ui',
            isDragging ? 'border-leaf-500 bg-leaf-50' : 'border-leaf-200 bg-leaf-50/40',
          ].join(' ')}
          onDragLeave={() => setIsDragging(false)}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDrop={handleDrop}
        >
          {isUploading ? (
            <Loader2 className="h-8 w-8 animate-spin text-leaf-700" aria-hidden />
          ) : (
            <ImagePlus className="h-8 w-8 text-leaf-700" aria-hidden />
          )}
          <button
            className="mt-3 text-lg font-bold text-leaf-700 underline-offset-4 hover:underline disabled:opacity-60"
            disabled={isUploading}
            onClick={() => inputRef.current?.click()}
            type="button"
          >
            {isUploading ? '올리는 중...' : '내 기기에서 사진 선택'}
          </button>
          <p className="mt-1 text-sm text-slate-600">
            끌어다 놓아도 됩니다 · jpg png webp gif ·{' '}
            {formatNumber(MAX_IMAGE_SIZE_MB)}MB 이하
          </p>
        </div>
      )}

      {error ? (
        <p className="mt-2 text-sm font-medium text-feedback-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
