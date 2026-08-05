import { apiRequest, USE_MOCKS } from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
import { mockDelay } from '@/mocks/handlers';
import type { UploadedFile } from '@/types/api';

// 백엔드 FileStorageService와 같은 제한값입니다. 화면에서 미리 걸러 불필요한 업로드를 막습니다.
export const MAX_IMAGE_COUNT = 10;
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = '.jpg,.jpeg,.png,.webp,.gif';

const ACCEPTED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif'];

export function isAcceptedImage(file: File) {
  const extension = file.name.split('.').pop()?.toLowerCase();
  return extension !== undefined && ACCEPTED_EXTENSIONS.includes(extension);
}

export async function uploadImages(files: File[]): Promise<UploadedFile[]> {
  if (USE_MOCKS) {
    await mockDelay();
    // 미리보기가 실제로 보이도록 브라우저 로컬 URL을 발급합니다. 세션이 끝나면 사라집니다.
    // jsdom처럼 createObjectURL이 없는 환경에서는 형태만 같은 자리표시자 URL을 씁니다.
    return files.map((file, index) => ({
      url:
        typeof URL.createObjectURL === 'function'
          ? URL.createObjectURL(file)
          : `/files/mock-${index}-${file.name}`,
      originalName: file.name,
      size: file.size,
    }));
  }

  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));

  const response = await apiRequest<UploadedFile[]>(ENDPOINTS.files.upload, {
    method: 'POST',
    body: formData,
  });
  return response.data;
}
