import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      // Never bake the Gemini key into a production bundle. Cloudflare Pages
      // Functions hold GEMINI_API_KEY and the client calls /api/generate.
      define: {
        'process.env.API_KEY': JSON.stringify(mode === 'production' ? '' : (env.GEMINI_API_KEY || '')),
        'process.env.GEMINI_API_KEY': JSON.stringify(mode === 'production' ? '' : (env.GEMINI_API_KEY || ''))
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
