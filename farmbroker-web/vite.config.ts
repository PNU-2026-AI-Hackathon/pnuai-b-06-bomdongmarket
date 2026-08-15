import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

const WEB_DIR = fileURLToPath(new URL('.', import.meta.url));
const REPO_ROOT = fileURLToPath(new URL('..', import.meta.url));

export default defineConfig(({ mode }) => {
  // Vite는 envDir 한 곳(기본값: 이 폴더)만 읽는다. 그래서 백엔드와 함께 쓰는 저장소 루트 .env에
  // VITE_KAKAO_MAP_APP_KEY 같은 값을 적어도 번들에는 들어가지 않는다.
  // 루트 .env를 미리 읽어 process.env에 옮겨 두면, Vite가 이 설정 파일을 평가한 뒤 env를 확정할 때
  // 프리픽스가 붙은 process.env 값까지 함께 수집하므로 루트 한 곳에서만 관리해도 동작한다.
  //
  // farmbroker-web/.env나 셸에 이미 값이 있으면 그대로 두어 개인 로컬 설정이 항상 이긴다.
  // 빈 문자열은 .env.example을 복사만 하고 채우지 않은 상태이므로 값이 없는 것으로 본다.
  const localEnv = loadEnv(mode, WEB_DIR, 'VITE_');
  for (const [key, value] of Object.entries(loadEnv(mode, REPO_ROOT, 'VITE_'))) {
    if (!localEnv[key] && value) {
      process.env[key] = value;
    }
  }

  return {
    plugins: [react()],
    resolve: {
      alias: {
        // URL.pathname을 그대로 쓰면 경로의 공백이 %20으로 남고 윈도우에서는 앞에 /가 붙어
        // 저장소 경로에 공백이 있을 때 @ 별칭이 전부 깨진다. fileURLToPath로 실제 경로를 얻는다.
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  };
});
