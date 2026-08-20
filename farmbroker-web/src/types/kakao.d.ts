// 카카오 우편번호·지도 SDK는 npm 패키지가 아니라 CDN 스크립트로 들어오므로 전역 타입을 직접 선언합니다.
// 실제로 쓰는 표면만 좁게 선언합니다 — 여기 없는 API를 쓰려면 먼저 이 파일에 추가하세요.

// 우편번호 팝업이 돌려주는 값. 좌표는 포함되지 않으므로 지도는 별도 지오코딩이 필요합니다.
interface KakaoPostcodeData {
  /** 도로명주소. 지번만 있는 지역은 빈 문자열일 수 있습니다. */
  roadAddress: string;
  /** 지번주소. 도로명주소가 없을 때의 대체값입니다. */
  jibunAddress: string;
  zonecode: string;
  buildingName: string;
  bname: string;
}

interface KakaoPostcodeOptions {
  oncomplete: (data: KakaoPostcodeData) => void;
  onclose?: (state: string) => void;
}

interface KakaoPostcode {
  open: () => void;
}

type KakaoPostcodeConstructor = new (options: KakaoPostcodeOptions) => KakaoPostcode;

interface KakaoLatLng {
  getLat: () => number;
  getLng: () => number;
}

// 남서(sw)·북동(ne) 두 점이 이루는 사각 범위. 반경 원이 화면에 들어오도록 지도를 맞출 때 쓴다.
interface KakaoLatLngBounds {
  getSouthWest: () => KakaoLatLng;
  getNorthEast: () => KakaoLatLng;
}

interface KakaoMap {
  setCenter: (position: KakaoLatLng) => void;
  setLevel: (level: number) => void;
  // 주어진 범위가 모두 보이도록 지도의 중심·확대수준을 한 번에 맞춘다.
  setBounds: (bounds: KakaoLatLngBounds) => void;
  relayout: () => void;
}

interface KakaoMarker {
  setPosition: (position: KakaoLatLng) => void;
  setMap: (map: KakaoMap | null) => void;
}

interface KakaoCircle {
  setMap: (map: KakaoMap | null) => void;
  setPosition: (position: KakaoLatLng) => void;
  setRadius: (meters: number) => void;
}

/** addressSearch 결과 한 건. x가 경도(lng), y가 위도(lat)이며 둘 다 문자열로 온다. */
interface KakaoGeocoderResult {
  x: string;
  y: string;
  address_name: string;
}

interface KakaoAddressName {
  address_name: string;
}

/** coord2Address 결과 한 건. 도로명주소는 지역에 따라 null일 수 있어 지번(address)으로 폴백한다. */
interface KakaoCoord2AddressResult {
  road_address: KakaoAddressName | null;
  address: KakaoAddressName | null;
}

interface KakaoGeocoder {
  addressSearch: (
    address: string,
    callback: (result: KakaoGeocoderResult[], status: string) => void,
  ) => void;
  /** 좌표 → 주소(역지오코딩). 인자 순서는 경도(x), 위도(y)다. */
  coord2Address: (
    longitude: number,
    latitude: number,
    callback: (result: KakaoCoord2AddressResult[], status: string) => void,
  ) => void;
}

/** 지도 클릭 등 마우스 이벤트가 콜백에 넘겨주는 객체. 클릭 지점의 좌표를 담는다. */
interface KakaoMapMouseEvent {
  latLng: KakaoLatLng;
}

interface KakaoMaps {
  /** autoload=false로 받은 SDK를 실제로 초기화합니다. services 라이브러리도 이 시점에 준비됩니다. */
  load: (callback: () => void) => void;
  LatLng: new (latitude: number, longitude: number) => KakaoLatLng;
  LatLngBounds: new (sw: KakaoLatLng, ne: KakaoLatLng) => KakaoLatLngBounds;
  Map: new (
    container: HTMLElement,
    options: { center: KakaoLatLng; level: number },
  ) => KakaoMap;
  Marker: new (options: { map?: KakaoMap; position: KakaoLatLng; title?: string }) => KakaoMarker;
  Circle: new (options: {
    center: KakaoLatLng;
    radius: number;
    strokeWeight?: number;
    strokeColor?: string;
    strokeOpacity?: number;
    fillColor?: string;
    fillOpacity?: number;
  }) => KakaoCircle;
  event: {
    // 마커 클릭은 인자를 무시하고(() => void도 대입 가능), 지도 클릭은 KakaoMapMouseEvent를 받는다.
    addListener: (
      target: object,
      type: string,
      handler: (mouseEvent: KakaoMapMouseEvent) => void,
    ) => void;
    removeListener: (
      target: object,
      type: string,
      handler: (mouseEvent: KakaoMapMouseEvent) => void,
    ) => void;
  };
  services: {
    Geocoder: new () => KakaoGeocoder;
    Status: { OK: string; ZERO_RESULT: string; ERROR: string };
  };
}

interface Window {
  // 우편번호 스크립트와 지도 SDK가 같은 kakao 네임스페이스에 각각 Postcode / maps를 얹습니다.
  // 어느 쪽도 로드되지 않았을 수 있으므로 두 속성 모두 선택적입니다.
  kakao?: {
    Postcode?: KakaoPostcodeConstructor;
    maps?: KakaoMaps;
  };
}
