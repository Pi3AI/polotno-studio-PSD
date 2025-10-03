import { sentryVitePlugin } from '@sentry/vite-plugin';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import analyzer from 'vite-bundle-analyzer';

export default defineConfig({
  plugins: [
    react(),
    sentryVitePlugin({
      org: 'polotno',
      project: 'polotno-studio',
    }),
    analyzer(),
  ],

  server: {
    port: 3002,
    host: '0.0.0.0', // 允许外部访问
    hmr: {
      port: 3002,
      host: '0.0.0.0',
    },
  },

  build: {
    sourcemap: true,
  },
});
