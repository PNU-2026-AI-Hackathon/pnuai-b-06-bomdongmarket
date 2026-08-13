/// <reference types="vite/client" />

// vite/client가 선언한 ImportMetaEnv에 프로젝트 환경변수를 병합해 오타를 컴파일 타임에 잡습니다.
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_USE_MOCKS?: string;
  // 지도 미리보기에만 쓰이는 선택 값입니다. 없으면 지도 영역만 안내 문구로 대체됩니다.
  readonly VITE_KAKAO_MAP_APP_KEY?: string;
}
