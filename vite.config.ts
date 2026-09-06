import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    target: 'esnext',
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: './index.html',
        studio: './studio.html',
      },
    },
  },
  server: {
    port: 3000,
    open: false,
  },
});
