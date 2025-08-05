/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@components': resolve(__dirname, './src/components'),
      '@hooks': resolve(__dirname, './src/hooks'),
      '@utils': resolve(__dirname, './src/utils'),
      '@types': resolve(__dirname, './src/types'),
      '@styles': resolve(__dirname, './src/styles'),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `
          @use "@ai-toolkit/ui-styles/scss/abstracts/variables" as *;
          @use "@ai-toolkit/ui-styles/scss/abstracts/mixins" as *;
          @use "@ai-toolkit/ui-styles/scss/abstracts/functions" as *;
          @use "@ai-toolkit/ui-styles/scss/components/forms" as *;
          @use "@ai-toolkit/ui-styles/scss/components/cards" as *;
          @use "@ai-toolkit/ui-styles/scss/components/buttons" as *;
          @use "@ai-toolkit/ui-styles/scss/components/badges" as *;
          @use "@ai-toolkit/ui-styles/scss/utilities/colors" as *;
          @use "@ai-toolkit/ui-styles/scss/utilities/spacing" as *;
          @use "@ai-toolkit/ui-styles/scss/utilities/layout" as *;
          @use "@ai-toolkit/ui-styles/scss/utilities/dashboard" as *;
        `,
      },
    },
    postcss: './postcss.config.js',
  },
  server: {
    port: 5173,
    host: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.css')) {
            return 'assets/css/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    deps: {
      inline: ['socket.io-client'],
    },
  },
});