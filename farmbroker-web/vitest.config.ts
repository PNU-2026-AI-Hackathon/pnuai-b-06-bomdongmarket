import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      // vite.config.ts와 같은 이유로 fileURLToPath를 쓴다. URL.pathname은 경로의 공백을
      // %20으로 남기고 윈도우에서 앞에 /를 붙여 @ 별칭이 전부 깨진다.
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    css: true,
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
});
