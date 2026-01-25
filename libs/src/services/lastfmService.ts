
import type { LastfmTrackScrobble } from '../types';
import { md5 } from '../adapters/cryptoAdapter';

const API_BASE = 'https://ws.audioscrobbler.com/2.0/';

const createLastfmSignature = async (params: Record<string, string>, secret: string): Promise<string> => {
  const sortedKeys = Object.keys(params).sort();
  let sigString = '';
  sortedKeys.forEach(key => {
    if (key !== 'format' && key !== 'callback') {
      sigString += key + params[key];
    }
  });
  sigString += secret;
  return await md5(sigString);
};

interface LastfmApiResponse {
  error?: number;
  message?: string;
  session?: { key: string; name: string };
  scrobbles?: unknown;
  [key: string]: unknown;
}

const apiCall = async (params: Record<string, string>, secret?: string, method: 'GET' | 'POST' = 'GET'): Promise<LastfmApiResponse> => {
  const allParams: Record<string, string> = { ...params, format: 'json' };

  if (secret) {
    const signature = await createLastfmSignature(params, secret);
    allParams.api_sig = signature;
    console.log('[Last.fm] Generated signature:', signature);
  }

  const searchParams = new URLSearchParams(allParams);
  const url = `${API_BASE}?${searchParams.toString()}`;
  console.log('[Last.fm] API call:', method, url);

  const response = await fetch(url, { method });
  const data = await response.json() as LastfmApiResponse;
  console.log('[Last.fm] Response:', data);

  if (data.error) {
    throw new Error(`Last.fm API Error: ${data.message} (code: ${data.error})`);
  }

  return data;
};

export const getLastfmSession = async (apiKey: string, secret: string, token: string) => {
  console.log('[Last.fm] getLastfmSession called with:', { apiKey: apiKey ? '[set]' : '[empty]', secret: secret ? '[set]' : '[empty]', token });
  const params = {
    method: 'auth.getsession',
    api_key: apiKey,
    token,
  };
  console.log('[Last.fm] Request params:', params);
  const data = await apiCall(params, secret);
  return data.session;
};

export const scrobbleTracks = async (
  tracks: LastfmTrackScrobble[],
  sessionKey: string,
  apiKey: string,
  secret: string
) => {
  const params: Record<string, string> = {
    method: 'track.scrobble',
    api_key: apiKey,
    sk: sessionKey,
  };

  tracks.forEach((track, index) => {
    params[`artist[${index}]`] = track.artist;
    params[`track[${index}]`] = track.track;
    if (track.album) {
      params[`album[${index}]`] = track.album;
    }
    params[`timestamp[${index}]`] = track.timestamp.toString();
  });

  const data = await apiCall(params, secret, 'POST');
  return data.scrobbles;
};