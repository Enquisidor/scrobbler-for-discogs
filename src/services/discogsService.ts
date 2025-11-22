
import type { Credentials, DiscogsRelease, QueueItem, DiscogsArtist } from '../types';
import { cleanArtistName, formatArtistNames } from '../hooks/utils/formattingUtils';

// This file assumes CryptoJS is loaded globally from a CDN in index.html
declare const CryptoJS: any;

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
          artist_display_name: formatArtistNames(cleanedArtists) || 'Unknown Artist',
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

    if (releaseData.artists) {
        releaseData.artists = releaseData.artists.map((artist: any) => ({
            ...artist,
            name: cleanArtistName(artist.name)
        }));
    }

    return releaseData;
}