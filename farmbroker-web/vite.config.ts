import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // URL.pathname을 그대로 쓰면 경로의 공백이 %20으로 남고 윈도우에서는 앞에 /가 붙어
      // 저장소 경로에 공백이 있을 때 @ 별칭이 전부 깨진다. fileURLToPath로 실제 경로를 얻는다.
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
