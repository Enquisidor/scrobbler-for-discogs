import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    // Load env from libs/.env
    const env = loadEnv(mode, path.resolve(__dirname, '../libs'), '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        // Expose API keys from libs/.env
        'process.env.DISCOGS_REQUEST_SECRET': JSON.stringify(env.DISCOGS_REQUEST_SECRET),
        'process.env.DISCOGS_CONSUMER_KEY': JSON.stringify(env.DISCOGS_CONSUMER_KEY),
        'process.env.DISCOGS_CONSUMER_SECRET': JSON.stringify(env.DISCOGS_CONSUMER_SECRET),
        'process.env.LASTFM_API_KEY': JSON.stringify(env.LASTFM_API_KEY),
        'process.env.LASTFM_SECRET': JSON.stringify(env.LASTFM_SECRET),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
          '@libs': path.resolve(__dirname, '../libs/src'),
        }
      }
    };
});
