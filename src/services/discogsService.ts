import type { Credentials, DiscogsRelease, QueueItem } from '../types';

// This file assumes CryptoJS is loaded globally from a CDN in index.html
declare const CryptoJS: any;

const API_BASE = 'https://api.discogs.com';

// IMPORTANT: Replace with your actual Discogs application credentials.
// You can get these from your Discogs developer settings: https://www.discogs.com/settings/developers
// These are exposed on the client-side, which is not ideal for production.
// For a real-world app, an intermediary server would be used to protect the secret.
const CONSUMER_KEY = 'GwlBnzIstBUPmTsYjtgN';
const CONSUMER_SECRET = 'pfoWbAvyoguwrrhaSyCfGBPQAPpHNJVU';

const cleanArtistName = (name: string): string => {
  // Removes "(n)" from artist names, e.g., "Artist (2)" -> "Artist"
  return name.replace(/\s\(\d+\)$/, '').trim();
};

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
    oauth_nonce: Math.random().toString(36).substring(2),
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

    const response = await fetch(finalUrl, {
        method: 'GET',
        headers: {
            'User-Agent': 'VinylScrobbler/1.0',
        },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(`Discogs API Error: ${errorData.message} (Status: ${response.status})`);
    }
    return response.json();
}

// --- OAuth Flow Functions ---

export const getRequestToken = async (): Promise<{ requestToken: string; requestTokenSecret: string; authorizeUrl: string }> => {
  if (CONSUMER_KEY === 'REPLACE_WITH_YOUR_DISCOGS_CONSUMER_KEY' || CONSUMER_SECRET === 'REPLACE_WITH_YOUR_DISCOGS_CONSUMER_SECRET') {
    throw new Error('Discogs API keys not configured. Please edit services/discogsService.ts and replace the placeholder keys with your own from your Discogs developer settings.');
  }
  const url = `${API_BASE}/oauth/request_token`;
  const bodyParams = { oauth_callback: window.location.href.split('?')[0] };
  const oauthParams = generateOauthParams('POST', url, bodyParams);
  const allParams = { ...bodyParams, ...oauthParams };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'VinylScrobbler/1.0',
    },
    body: new URLSearchParams(allParams).toString()
  });

  if (!response.ok) throw new Error('Failed to get Discogs request token.');
  
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

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'VinylScrobbler/1.0',
    },
    body: new URLSearchParams(allParams).toString()
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


export const fetchDiscogsCollection = async (
  username: string,
  accessToken: string,
  accessTokenSecret: string,
  onProgress: (progress: number, total: number) => void
): Promise<DiscogsRelease[]> => {
  let allReleases: DiscogsRelease[] = [];
  let currentPage = 1;
  let totalPages = 1;

  do {
    const endpoint = `/users/${username}/collection/folders/0/releases?page=${currentPage}&per_page=100`;
    const data: CollectionResponse = await discogsFetch(endpoint, accessToken, accessTokenSecret);
    
    const cleanedReleases = data.releases.map(release => {
      if (!release.basic_information?.artists) {
        return {
          ...release,
          basic_information: {
            ...release.basic_information,
            artist_display_name: 'Unknown Artist',
          }
        };
      }
      
      const cleanedArtists = release.basic_information.artists.map(artist => ({
        ...artist,
        name: cleanArtistName(artist.name)
      }));

      return {
        ...release,
        basic_information: {
          ...release.basic_information,
          artists: cleanedArtists,
          artist_display_name: cleanedArtists.map(a => a.name).join(', '),
        }
      };
    });

    allReleases = allReleases.concat(cleanedReleases);
    totalPages = data.pagination.pages;
    onProgress(currentPage, totalPages);
    currentPage++;
  } while (currentPage <= totalPages);

  return allReleases;
};

export const fetchReleaseTracklist = async (releaseId: number, accessToken: string, accessTokenSecret: string): Promise<QueueItem> => {
    const endpoint = `/releases/${releaseId}`;
    const releaseData = await discogsFetch(endpoint, accessToken, accessTokenSecret);

    if (releaseData.artists) {
        releaseData.artists = releaseData.artists.map((artist: any) => ({
            ...artist,
            name: cleanArtistName(artist.name)
        }));
    }

    return releaseData;
}