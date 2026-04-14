import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  root: 'frontend',
  base: process.env.NODE_ENV === 'production' ? '/TallerReproductorDeMusica/' : '/',
  
  build: {
    outDir: '../dist/frontend',
    emptyOutDir: true,
  },
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './frontend'),
      '@ui': path.resolve(__dirname, './frontend/ui'),
      '@app': path.resolve(__dirname, './frontend/app'),
      '@api': path.resolve(__dirname, './frontend/api'),
      '@types': path.resolve(__dirname, './frontend/types'),
    },
  },
  
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});
