/**
 * Shared API configuration.
 *
 * All API keys are loaded from libs/.env at build time.
 * Both web and mobile read from this shared config.
 *
 * Setup:
 * 1. Copy libs/.env.example to libs/.env
 * 2. Fill in your API credentials from:
 *    - Discogs: https://www.discogs.com/settings/developers
 *    - Last.fm: https://www.last.fm/api/account/create
 */

export interface AppConfig {
  discogs: {
    requestSecret: string;
    consumerKey: string;
    consumerSecret: string;
  };
  lastfm: {
    apiKey: string;
    secret: string;
  };
}

/** Storage key names for OAuth flow state (temporary storage during auth redirect) */
export const STORAGE_KEYS = {
  DISCOGS_REQUEST_TOKEN: 'discogs-request-token',
  DISCOGS_REQUEST_TOKEN_SECRET: 'discogs-request-token-secret',
  CREDENTIALS_LAST_ACTIVITY: 'scrobbler-credentials-last-activity',
} as const;

/** Credential expiry time in milliseconds (7 days) */
export const CREDENTIALS_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

let config: AppConfig = {
  discogs: {
    requestSecret: '',
    consumerKey: '',
    consumerSecret: '',
  },
  lastfm: {
    apiKey: '',
    secret: '',
  },
};

/**
 * Initialize the config with environment values.
 * Each platform passes in the values from their respective env loading mechanism:
 * - Web: Vite's import.meta.env (configured to read from libs/.env)
 * - Mobile: react-native-dotenv's @env module (configured to read from libs/.env)
 */
export function initConfig(envConfig: {
  DISCOGS_PERSONAL_ACCESS_TOKEN?: string;
  DISCOGS_CONSUMER_KEY?: string;
  DISCOGS_CONSUMER_SECRET?: string;
  LASTFM_API_KEY?: string;
  LASTFM_SECRET?: string;
}): void {
  config = {
    discogs: {
      requestSecret: envConfig.DISCOGS_PERSONAL_ACCESS_TOKEN || '',
      consumerKey: envConfig.DISCOGS_CONSUMER_KEY || '',
      consumerSecret: envConfig.DISCOGS_CONSUMER_SECRET || '',
    },
    lastfm: {
      apiKey: envConfig.LASTFM_API_KEY || '',
      secret: envConfig.LASTFM_SECRET || '',
    },
  };
}

export function getConfig(): AppConfig {
  return config;
}

export const getDiscogsConfig = () => config.discogs;
export const getLastfmConfig = () => config.lastfm;
