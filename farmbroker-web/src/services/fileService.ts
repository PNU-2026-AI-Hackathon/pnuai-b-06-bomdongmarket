import { apiRequest, USE_MOCKS } from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
import { mockDelay } from '@/mocks/handlers';
import type { UploadedFile } from '@/types/api';

// 백엔드 FileStorageService와 같은 제한값입니다. 화면에서 미리 걸러 불필요한 업로드를 막습니다.
export const MAX_IMAGE_COUNT = 10;
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = '.jpg,.jpeg,.png,.webp,.gif';

// 채팅 사진은 백엔드에서 ChatImageStorage 가 따로 받습니다. 상품 이미지와 달리 gif 를
// 받지 않으므로 위 목록을 그대로 쓰면 고를 수는 있지만 서버가 FILE_TYPE_NOT_SUPPORTED 로
// 되돌립니다. 두 제한을 한 이름으로 합치지 않고 따로 둡니다.
export const ACCEPTED_CHAT_IMAGE_TYPES = '.jpg,.jpeg,.png,.webp';

const ACCEPTED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
const ACCEPTED_CHAT_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];

function hasExtensionIn(file: File, extensions: readonly string[]) {
  const extension = file.name.split('.').pop()?.toLowerCase();
  return extension !== undefined && extensions.includes(extension);
}

export function isAcceptedImage(file: File) {
  return hasExtensionIn(file, ACCEPTED_EXTENSIONS);
}

export function isAcceptedChatImage(file: File) {
  return hasExtensionIn(file, ACCEPTED_CHAT_EXTENSIONS);
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

// 업로드된 파일 URL에서 서버가 발급한 저장 파일명을 뽑아냅니다.
// 우리가 올린 파일이 아니면(외부 CDN URL 등) null을 돌려주고 삭제 요청을 보내지 않습니다.
function toStoredFileName(url: string) {
  const match = /\/files\/([0-9a-f]{32}\.[a-z]{3,4})$/.exec(url);
  return match?.[1] ?? null;
}

// 선택을 취소한 이미지를 서버에서도 지웁니다.
// 화면 배열에서만 빼면 디스크에 고아 파일이 남고, URL을 아는 사람은 계속 열람할 수 있습니다.
export async function deleteImage(url: string): Promise<void> {
  const fileName = toStoredFileName(url);
  if (USE_MOCKS || fileName === null) return;

  await apiRequest<void>(ENDPOINTS.files.detail(fileName), { method: 'DELETE' });
}
