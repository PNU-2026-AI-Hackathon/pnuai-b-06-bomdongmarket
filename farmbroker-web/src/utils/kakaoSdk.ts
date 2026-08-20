// 카카오 우편번호·지도 스크립트를 필요한 화면에서만 내려받는 로더입니다.
// index.html에 <script>를 박으면 모든 페이지가 SDK를 받게 되고 테스트(jsdom)에서도 매번 로드를 시도하므로,
// 주소를 다루는 화면에서만 이 함수를 호출합니다.

// 우편번호 스크립트는 앱키가 필요 없습니다.
const POSTCODE_SCRIPT_SRC =
  'https://t1.kakaocdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';

// 지도는 앱키가 필수입니다. autoload=false로 받아 kakao.maps.load()로 직접 초기화해야
// libraries=services(지오코딩)까지 준비된 시점을 알 수 있습니다.
const MAPS_SDK_SRC = 'https://dapi.kakao.com/v2/maps/sdk.js';

const SDK_TIMEOUT_MS = 10_000;

const KAKAO_MAP_APP_KEY = (import.meta.env.VITE_KAKAO_MAP_APP_KEY ?? '').trim();

// 같은 스크립트를 두 번 넣지 않도록 src별로 Promise를 캐시합니다.
// React StrictMode의 이중 마운트나 화면 재진입에서 <script>가 중복 생성되는 것을 막습니다.
const scriptPromises = new Map<string, Promise<void>>();
let mapsPromise: Promise<KakaoMaps> | null = null;

function loadScript(src: string): Promise<void> {
  const cached = scriptPromises.get(src);
  if (cached) return cached;

  const promise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    const timeoutId = window.setTimeout(() => {
      fail(new Error(`스크립트 응답 시간이 초과되었습니다: ${src}`));
    }, SDK_TIMEOUT_MS);

    function fail(error: Error) {
      window.clearTimeout(timeoutId);
      // 실패한 Promise를 캐시에 남겨 두면 재시도가 영원히 막히므로 지웁니다.
      scriptPromises.delete(src);
      script.remove();
      reject(error);
    }

    script.onload = () => {
      window.clearTimeout(timeoutId);
      resolve();
    };
    script.onerror = () => fail(new Error(`스크립트를 불러오지 못했습니다: ${src}`));
    document.head.append(script);
  });

  scriptPromises.set(src, promise);
  return promise;
}

/** 지도 앱키가 설정돼 있는지. 없으면 지도 영역을 안내 문구로 대체합니다. */
export function hasKakaoMapKey(): boolean {
  return KAKAO_MAP_APP_KEY.length > 0;
}

/** 우편번호 팝업 생성자를 돌려줍니다. 앱키 없이 동작합니다. */
export async function loadPostcodeScript(): Promise<KakaoPostcodeConstructor> {
  await loadScript(POSTCODE_SCRIPT_SRC);

  const postcode = window.kakao?.Postcode;
  if (!postcode) {
    throw new Error('카카오 우편번호 스크립트를 초기화하지 못했습니다.');
  }
  return postcode;
}

interface LoadKakaoMapsOptions {
  /** 오류 UI의 명시적인 재시도에서만 이전 실패 결과를 버립니다. */
  retry?: boolean;
}

/** 지오코딩까지 준비된 지도 네임스페이스를 돌려줍니다. */
export function loadKakaoMaps(options: LoadKakaoMapsOptions = {}): Promise<KakaoMaps> {
  if (!hasKakaoMapKey()) {
    return Promise.reject(new Error('VITE_KAKAO_MAP_APP_KEY가 설정되지 않았습니다.'));
  }

  if (options.retry) mapsPromise = null;
  if (mapsPromise) return mapsPromise;

  mapsPromise = loadScript(
    `${MAPS_SDK_SRC}?appkey=${KAKAO_MAP_APP_KEY}&autoload=false&libraries=services`,
  )
    .then(() => {
      const maps = window.kakao?.maps;
      if (!maps) {
        throw new Error('카카오 지도 SDK를 초기화하지 못했습니다.');
      }

      // HMR이나 늦게 도착한 이전 콜백으로 이미 준비됐다면 load()를 다시 호출하지 않는다.
      if (typeof maps.Map === 'function' && typeof maps.services?.Geocoder === 'function') {
        return maps;
      }

      return new Promise<KakaoMaps>((resolve, reject) => {
        const timeoutId = window.setTimeout(() => {
          reject(new Error('카카오 지도 SDK 초기화 응답 시간이 초과되었습니다.'));
        }, SDK_TIMEOUT_MS);

        try {
          maps.load(() => {
            window.clearTimeout(timeoutId);
            resolve(maps);
          });
        } catch (error) {
          window.clearTimeout(timeoutId);
          reject(error);
        }
      });
    })
    .catch((error: unknown) => {
      // 자동 재진입에서는 같은 실패를 즉시 돌려주고, 오류 UI의 명시적 재시도만 캐시를 비운다.
      throw error;
    });

  return mapsPromise;
}
