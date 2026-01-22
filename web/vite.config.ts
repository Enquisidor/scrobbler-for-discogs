import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { config as dotenvConfig } from 'dotenv';

// Load env from libs/.env
dotenvConfig({ path: path.resolve(__dirname, '../libs/.env') });

export default defineConfig(() => {
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    define: {
      // Expose API keys from libs/.env
      'process.env.DISCOGS_PERSONAL_ACCESS_TOKEN': JSON.stringify(process.env.DISCOGS_PERSONAL_ACCESS_TOKEN),
      'process.env.DISCOGS_CONSUMER_KEY': JSON.stringify(process.env.DISCOGS_CONSUMER_KEY),
      'process.env.DISCOGS_CONSUMER_SECRET': JSON.stringify(process.env.DISCOGS_CONSUMER_SECRET),
      'process.env.LASTFM_API_KEY': JSON.stringify(process.env.LASTFM_API_KEY),
      'process.env.LASTFM_SECRET': JSON.stringify(process.env.LASTFM_SECRET),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        '@libs': path.resolve(__dirname, '../libs/src'),
      }
    }
  };
});
