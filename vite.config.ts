import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  const rawBase = process.env.VITE_BASE_PATH || '';
  const cleanBase = rawBase.trim().replace(/^['"]+|['"]+$/g, '').trim();

  let base = './';
  if (cleanBase && cleanBase !== '.' && cleanBase !== './') {
    if (cleanBase === '/') {
      base = '/';
    } else {
      const withLeading = cleanBase.startsWith('/') || cleanBase.startsWith('.') ? cleanBase : '/' + cleanBase;
      base = withLeading.endsWith('/') ? withLeading : withLeading + '/';
    }
  }

  return {
    base,
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
      dedupe: ['react', 'react-dom'],
    },
    build: {
      chunkSizeWarningLimit: 10000,
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify - file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
