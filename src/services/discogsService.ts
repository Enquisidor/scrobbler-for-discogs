
import type { Credentials, DiscogsRelease, QueueItem, DiscogsArtist } from '../types';
import { getDisplayArtistName, formatArtistNames } from '../hooks/utils/formattingUtils';

// This file assumes CryptoJS is loaded globally from a CDN in index.html
declare const CryptoJS: any;

// Custom Error types for specific API responses
export class DiscogsAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DiscogsAuthError';
  }
}

export class DiscogsRateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DiscogsRateLimitError';
  }
}


// Direct API Base URL - No Proxy
const API_BASE = 'https://api.discogs.com';

// IMPORTANT: Replace with your actual Discogs application credentials.
// You can get these from your Discogs developer settings: https://www.discogs.com/settings/developers
// These are exposed on the client-side, which is not ideal for production.
// For a real-world app, an intermediary server would be used to protect the secret.
const CONSUMER_KEY = 'GwlBnzIstBUPmTsYjtgN';
const CONSUMER_SECRET = 'pfoWbAvyoguwrrhaSyCfGBPQAPpHNJVU';

interface CollectionResponse {
  pagination: {
    pages: number;
    page: number;
    items: number;
  };
  releases: DiscogsRelease[];
}

interface DiscogsIdentity {
  id: number;
  username: string;
  resource_url: string;
  consumer_name: string;
}

// --- OAuth 1.0a Helpers ---

function rfc3986encode(str: string): string {
  return encodeURIComponent(str)
    .replace(/!/g, '%21')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
    .replace(/\*/g, '%2A');
}

function generateOauthParams(
  method: string,
  url: string,
  params: Record<string, string>,
  token = '',
  tokenSecret = ''
): Record<string, string> {
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: CONSUMER_KEY,
    oauth_nonce: `${Date.now()}${Math.random().toString(36).substring(2)}`,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: String(Math.floor(Date.now() / 1000)),
    oauth_version: '1.0',
    ...(token && { oauth_token: token }),
  };

  const allParams = { ...params, ...oauthParams };
  const sortedKeys = Object.keys(allParams).sort();
  const paramString = sortedKeys
    .map(key => `${rfc3986encode(key)}=${rfc3986encode(allParams[key])}`)
    .join('&');

  const baseString = `${method.toUpperCase()}&${rfc3986encode(url)}&${rfc3986encode(paramString)}`;
  const signingKey = `${rfc3986encode(CONSUMER_SECRET)}&${rfc3986encode(tokenSecret)}`;

  const signature = CryptoJS.enc.Base64.stringify(CryptoJS.HmacSHA1(baseString, signingKey));
  oauthParams.oauth_signature = signature;
  
  return oauthParams;
}

// Helper utility for delays
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const MAX_RETRIES = 3;
const BASE_DELAY = 1000; // 1 second

async function discogsFetch(
  endpoint: string,
  accessToken: string,
  accessTokenSecret: string
): Promise<any> {
    const [path, queryString] = endpoint.split('?');
    const url = `${API_BASE}${path}`;
    const queryParams = new URLSearchParams(queryString);
    const paramsObject: Record<string, string> = {};
    queryParams.forEach((value, key) => {
        paramsObject[key] = value;
    });

    const oauthParams = generateOauthParams('GET', url, paramsObject, accessToken, accessTokenSecret);
    
    const finalParams = new URLSearchParams({ ...paramsObject, ...oauthParams });
    const finalUrl = `${url}?${finalParams.toString()}`;

    let attempt = 0;
    while (attempt < MAX_RETRIES) {
        try {
            // Direct fetch to Discogs API
            const response = await fetch(finalUrl, {
                method: 'GET',
                headers: {
                    'User-Agent': 'VinylScrobbler/1.0',
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
            });

            if (response.ok) {
                return await response.json();
            }

            // Specific handling for Auth errors (don't retry)
            if (response.status === 401) {
                throw new DiscogsAuthError('Authentication failed. Please reconnect Discogs.');
            }

            // Retry on Rate Limits (429) or Server Errors (5xx)
            if (response.status === 429 || response.status >= 500) {
                 const isRateLimit = response.status === 429;
                 const errorMessage = isRateLimit ? 'Rate limit exceeded' : `Server error ${response.status}`;
                 
                 attempt++;
                 if (attempt < MAX_RETRIES) {
                     const delay = BASE_DELAY * Math.pow(2, attempt - 1); // Exponential backoff: 1s, 2s, 4s...
                     console.warn(`[Discogs API] ${errorMessage}. Retrying in ${delay}ms... (Attempt ${attempt}/${MAX_RETRIES})`);
                     await wait(delay);
                     continue;
                 } else {
                     if (isRateLimit) throw new DiscogsRateLimitError('Discogs API rate limit exceeded after retries.');
                     // Fall through to generic error
                 }
            }

            const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
            throw new Error(`Discogs API Error: ${errorData.message} (Status: ${response.status})`);

        } catch (error) {
            // Rethrow explicit Auth/RateLimit errors immediately
            if (error instanceof DiscogsAuthError || error instanceof DiscogsRateLimitError) {
                throw error;
            }
            
            // If it's the last attempt, throw
            if (attempt === MAX_RETRIES - 1) {
                throw error;
            }

            // If it's a network error (fetch failed completely), retry
            attempt++;
            const delay = BASE_DELAY * Math.pow(2, attempt - 1);
            console.warn(`[Discogs API] Network error. Retrying in ${delay}ms... (Attempt ${attempt}/${MAX_RETRIES})`, error);
            await wait(delay);
        }
    }
}

// --- OAuth Flow Functions ---

export const getRequestToken = async (): Promise<{ requestToken: string; requestTokenSecret: string; authorizeUrl: string }> => {
  const url = `${API_BASE}/oauth/request_token`;
  const bodyParams = { oauth_callback: window.location.href.split('?')[0] };
  const oauthParams = generateOauthParams('POST', url, bodyParams);
  const allParams = { ...bodyParams, ...oauthParams };
  
  const targetUrl = `${url}?${new URLSearchParams(allParams).toString()}`;

  // Direct fetch for request token
  const response = await fetch(targetUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'VinylScrobbler/1.0',
      'Accept': 'application/x-www-form-urlencoded'
    },
  });

  if (!response.ok) throw new Error('Failed to get Discogs request token. (Check CORS/Network)');
  
  const responseText = await response.text();
  const responseParams = new URLSearchParams(responseText);
  
  const requestToken = responseParams.get('oauth_token');
  const requestTokenSecret = responseParams.get('oauth_token_secret');

  if (!requestToken || !requestTokenSecret) {
    throw new Error('Invalid request token response from Discogs.');
  }

  return {
    requestToken,
    requestTokenSecret,
    authorizeUrl: `https://www.discogs.com/oauth/authorize?oauth_token=${requestToken}`,
  };
};

export const getAccessToken = async (
  requestToken: string,
  requestTokenSecret: string,
  oauthVerifier: string
): Promise<{ accessToken: string; accessTokenSecret: string }> => {
  const url = `${API_BASE}/oauth/access_token`;
  const bodyParams = { oauth_verifier: oauthVerifier };
  const oauthParams = generateOauthParams('POST', url, bodyParams, requestToken, requestTokenSecret);
  const allParams = { ...bodyParams, ...oauthParams };

  const targetUrl = `${url}?${new URLSearchParams(allParams).toString()}`;

  // Direct fetch for access token
  const response = await fetch(targetUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'VinylScrobbler/1.0',
    },
  });

  if (!response.ok) throw new Error('Failed to get Discogs access token.');

  const responseText = await response.text();
  const responseParams = new URLSearchParams(responseText);
  
  const accessToken = responseParams.get('oauth_token');
  const accessTokenSecret = responseParams.get('oauth_token_secret');
  
  if (!accessToken || !accessTokenSecret) {
    throw new Error('Invalid access token response from Discogs.');
  }

  return { accessToken, accessTokenSecret };
};


// --- API Functions ---

export const getDiscogsIdentity = async (accessToken: string, accessTokenSecret: string): Promise<DiscogsIdentity> => {
  return discogsFetch('/oauth/identity', accessToken, accessTokenSecret);
};


export const fetchDiscogsPage = async (
  username: string,
  accessToken: string,
  accessTokenSecret: string,
  page: number = 1,
  sort: string = 'added',
  sortOrder: 'asc' | 'desc' = 'desc',
  perPage: number = 50 // Discogs max is 100, but 50 is good for smooth loading
): Promise<{ releases: DiscogsRelease[]; pagination: CollectionResponse['pagination'] }> => {
    const endpoint = `/users/${username}/collection/folders/0/releases?page=${page}&per_page=${perPage}&sort=${sort}&sort_order=${sortOrder}`;
    const data: CollectionResponse = await discogsFetch(endpoint, accessToken, accessTokenSecret);
    
    // The artist_display_name is now generated here from raw artist data.
    const cleanedReleases = data.releases.map(release => {
      const artists = release.basic_information?.artists;
      const artistDisplayName = artists ? formatArtistNames(artists) : 'Unknown Artist';

      return {
        ...release,
        basic_information: {
          ...release.basic_information,
          // We pass the raw artists array but replace the display name.
          artist_display_name: artistDisplayName,
        }
      };
    });

    return {
        releases: cleanedReleases,
        pagination: data.pagination
    };
};

export const fetchReleaseTracklist = async (releaseId: number, accessToken: string, accessTokenSecret: string): Promise<QueueItem> => {
    const endpoint = `/releases/${releaseId}`;
    const releaseData = await discogsFetch(endpoint, accessToken, accessTokenSecret);
    // No longer pre-cleaning artist names here. The raw data is passed through.
    return releaseData;
}