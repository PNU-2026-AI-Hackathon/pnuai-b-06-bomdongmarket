import { describe, expect, it, vi } from 'vitest';

import { MAX_IMAGE_COUNT, deleteImage, isAcceptedImage } from '@/services/fileService';

function file(name: string, type: string) {
  return new File([new Uint8Array(8)], name, { type });
}

// input의 accept 속성이 대부분을 걸러주지만, 드래그·수동 선택을 대비한 백스톱입니다.
// 최종 판정은 서버(FileStorageService)가 확장자 기준으로 한 번 더 합니다.
describe('isAcceptedImage', () => {
  it('허용 확장자를 대소문자 구분 없이 받는다', () => {
    expect(isAcceptedImage(file('정면.jpg', 'image/jpeg'))).toBe(true);
    expect(isAcceptedImage(file('내부.PNG', 'image/png'))).toBe(true);
    expect(isAcceptedImage(file('전경.webp', 'image/webp'))).toBe(true);
  });

  it('Content-Type이 이미지여도 허용하지 않는 확장자는 거른다', () => {
    expect(isAcceptedImage(file('payload.svg', 'image/svg+xml'))).toBe(false);
    expect(isAcceptedImage(file('doc.pdf', 'image/jpeg'))).toBe(false);
    expect(isAcceptedImage(file('확장자없음', 'image/jpeg'))).toBe(false);
  });

  it('백엔드와 같은 최대 장수를 사용한다', () => {
    expect(MAX_IMAGE_COUNT).toBe(10);
  });
});

// 우리가 올린 파일만 삭제 요청을 보낸다. 외부 URL에 DELETE를 쏘면 안 된다.
describe('deleteImage', () => {
  it('우리가 발급하지 않은 URL에는 요청을 보내지 않는다', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    await deleteImage('https://images.unsplash.com/photo-1530836369250.jpg');
    await deleteImage('http://localhost:8080/api/files/not-a-uuid.jpg');

    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});
