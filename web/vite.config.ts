import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { existsSync } from 'fs';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { config as dotenvConfig } from 'dotenv';

// ESM-compatible __dirname using import.meta.url
const __filename = fileURLToPath(import.meta.url);
let __dirname = dirname(__filename);

// Fallback: if __dirname is root '/', use cwd instead (CI environment fix)
if (__dirname === '/' || __dirname === '') {
  console.log('[vite.config] __dirname is root, falling back to cwd');
  __dirname = process.cwd();
}

// Resolve paths - use path.join to avoid issues with absolute path resolution
const libsSrcPath = path.join(__dirname, '..', 'libs', 'src');

// Debug logging for CI environments
console.log('[vite.config] import.meta.url:', import.meta.url);
console.log('[vite.config] __filename:', __filename);
console.log('[vite.config] __dirname:', __dirname);
console.log('[vite.config] cwd:', process.cwd());
console.log('[vite.config] @libs path:', libsSrcPath);
console.log('[vite.config] @libs exists:', existsSync(libsSrcPath));
console.log('[vite.config] libs/src/index.ts exists:', existsSync(path.join(libsSrcPath, 'index.ts')));

// Load env from libs/.env (may not exist in CI)
try {
  dotenvConfig({ path: path.resolve(__dirname, '../libs/.env') });
} catch {
  console.log('[vite.config] No .env file found, using environment variables');
}

/**
 * Explicit middleware proxy for iTunes Search API.
 * Vite's `server.proxy` can fall through to the SPA (HTML) on some setups;
 * this always forwards /api/itunes/* to Apple from Node (no browser CORS).
 */
function itunesProxyPlugin(): Plugin {
  const handle = async (req: { url?: string; method?: string }, res: {
    statusCode: number;
    setHeader: (k: string, v: string) => void;
    end: (body?: string) => void;
  }) => {
    try {
      const incoming = new URL(req.url || '/', 'http://localhost');
      // Mounted at /api/itunes → req.url is like /search?term=...
      const applePath = incoming.pathname.startsWith('/search') || incoming.pathname.startsWith('/lookup')
        ? incoming.pathname
        : `/search${incoming.pathname === '/' ? '' : incoming.pathname}`;
      const appleUrl = `https://itunes.apple.com${applePath}${incoming.search}`;

      const appleRes = await fetch(appleUrl, {
        headers: { Accept: 'application/json' },
      });
      const body = await appleRes.text();
      res.statusCode = appleRes.status;
      res.setHeader('Content-Type', appleRes.headers.get('content-type') || 'application/json');
      res.setHeader('Cache-Control', 'no-store');
      res.end(body);
    } catch (err) {
      console.error('[itunes-proxy] failed', err);
      res.statusCode = 502;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'iTunes proxy failed', detail: String(err) }));
    }
  };

  return {
    name: 'itunes-proxy',
    configureServer(server) {
      server.middlewares.use('/api/itunes', (req, res) => {
        void handle(req, res);
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/itunes', (req, res) => {
        void handle(req, res);
      });
    },
  };
}

export default defineConfig(() => {
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react(), itunesProxyPlugin()],
    define: {
      // Expose API keys from libs/.env
      'process.env.DISCOGS_PERSONAL_ACCESS_TOKEN': JSON.stringify(process.env.DISCOGS_PERSONAL_ACCESS_TOKEN),
      'process.env.DISCOGS_CONSUMER_KEY': JSON.stringify(process.env.DISCOGS_CONSUMER_KEY),
      'process.env.DISCOGS_CONSUMER_SECRET': JSON.stringify(process.env.DISCOGS_CONSUMER_SECRET),
      'process.env.LASTFM_API_KEY': JSON.stringify(process.env.LASTFM_API_KEY),
      'process.env.LASTFM_SECRET': JSON.stringify(process.env.LASTFM_SECRET),
    },
    resolve: {
      // Deduplicate packages that must be singletons (libs has its own node_modules in CI)
      dedupe: ['react', 'react-dom', 'react-redux', 'immer'],
      alias: {
        '@': path.resolve(__dirname, '.'),
        '@libs': libsSrcPath,
        // Stub out react-native packages for web build
        'react-native': path.resolve(__dirname, 'src/stubs/react-native.ts'),
        '@react-native-async-storage/async-storage': path.resolve(__dirname, 'src/stubs/async-storage.ts'),
        'expo-secure-store': path.resolve(__dirname, 'src/stubs/expo-secure-store.ts'),
        'expo-crypto': path.resolve(__dirname, 'src/stubs/expo-crypto.ts'),
        'expo-auth-session': path.resolve(__dirname, 'src/stubs/expo-stub.ts'),
        'expo-web-browser': path.resolve(__dirname, 'src/stubs/expo-stub.ts'),
      }
    }
  };
});
