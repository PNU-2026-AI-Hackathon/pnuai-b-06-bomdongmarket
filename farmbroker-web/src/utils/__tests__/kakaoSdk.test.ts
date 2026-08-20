import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('loadKakaoMaps', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('VITE_KAKAO_MAP_APP_KEY', 'test-map-key');
    delete window.kakao;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    document.head.querySelectorAll('script[src*="dapi.kakao.com"]').forEach((script) => {
      script.remove();
    });
    delete window.kakao;
  });

  it('화면 재진입에서도 완료된 지도 SDK 초기화를 다시 호출하지 않는다', async () => {
    const { loadKakaoMaps } = await import('@/utils/kakaoSdk');
    let resolveFirstLoad = true;
    const load = vi.fn((callback: () => void) => {
      if (resolveFirstLoad) {
        resolveFirstLoad = false;
        callback();
      }
    });
    const maps = { load } as unknown as KakaoMaps;

    const firstLoad = loadKakaoMaps();
    const script = document.head.querySelector<HTMLScriptElement>(
      'script[src*="dapi.kakao.com/v2/maps/sdk.js"]',
    );
    expect(script).not.toBeNull();

    window.kakao = { maps };
    script?.onload?.(new Event('load'));
    await expect(firstLoad).resolves.toBe(maps);

    const secondLoad = loadKakaoMaps();
    const timeout = new Promise<never>((_, reject) => {
      window.setTimeout(() => reject(new Error('두 번째 SDK 호출이 완료되지 않았습니다.')), 50);
    });

    await expect(Promise.race([secondLoad, timeout])).resolves.toBe(maps);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('자동 재진입은 이전 실패를 재사용하고 명시적인 재시도만 스크립트를 다시 요청한다', async () => {
    const { loadKakaoMaps } = await import('@/utils/kakaoSdk');

    const firstLoad = loadKakaoMaps();
    const firstScript = document.head.querySelector<HTMLScriptElement>(
      'script[src*="dapi.kakao.com/v2/maps/sdk.js"]',
    );
    firstScript?.onerror?.(new Event('error'));
    await expect(firstLoad).rejects.toThrow('스크립트를 불러오지 못했습니다');

    await expect(loadKakaoMaps()).rejects.toThrow('스크립트를 불러오지 못했습니다');
    expect(
      document.head.querySelectorAll('script[src*="dapi.kakao.com/v2/maps/sdk.js"]'),
    ).toHaveLength(0);

    const retryLoad = loadKakaoMaps({ retry: true });
    const retryScript = document.head.querySelector<HTMLScriptElement>(
      'script[src*="dapi.kakao.com/v2/maps/sdk.js"]',
    );
    expect(retryScript).not.toBeNull();
    retryScript?.onerror?.(new Event('error'));
    await expect(retryLoad).rejects.toThrow('스크립트를 불러오지 못했습니다');
  });
});
