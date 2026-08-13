import { screen, waitFor } from '@testing-library/react';
import type userEvent from '@testing-library/user-event';
import { expect } from 'vitest';

// jsdom에서는 카카오 CDN 스크립트를 받을 수 없어 SDK 로더를 통째로 대체합니다.
// 주소 입력이 들어간 화면 테스트가 모두 같은 가짜 검색 결과를 쓰도록 여기에 모아 둡니다.

export const SEARCHED_ADDRESS = '부산광역시 금정구 부산대학로63번길 2';

const SEARCHED_POSTCODE_DATA = {
  roadAddress: SEARCHED_ADDRESS,
  jibunAddress: '부산광역시 금정구 장전동 30',
  zonecode: '46241',
  buildingName: '',
  bname: '장전동',
};

// vi.mock의 팩토리는 호이스팅되므로 반드시 동적 import로 불러와야 합니다.
// 예) vi.mock('@/utils/kakaoSdk', async () => (await import('@/test/kakaoSdkMock')).createKakaoSdkMock());
export function createKakaoSdkMock() {
  return {
    // 지도는 앱키가 없는 상태로 두어 테스트가 지도 SDK를 건드리지 않게 합니다.
    hasKakaoMapKey: () => false,
    loadKakaoMaps: () => Promise.reject(new Error('테스트에서는 지도를 쓰지 않습니다.')),
    // 팝업을 띄우는 대신 open() 즉시 검색 결과를 고른 것처럼 동작합니다.
    loadPostcodeScript: () =>
      Promise.resolve(
        class {
          constructor(private options: { oncomplete: (data: unknown) => void }) {}
          open() {
            this.options.oncomplete(SEARCHED_POSTCODE_DATA);
          }
        },
      ),
  };
}

/** 주소는 검색 팝업으로만 채울 수 있으므로 폼 테스트는 이 헬퍼로 값을 받아옵니다. */
export async function searchAddress(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: '주소 검색' }));
  await waitFor(() => {
    expect(screen.getByLabelText('주소')).toHaveValue(SEARCHED_ADDRESS);
  });
}
