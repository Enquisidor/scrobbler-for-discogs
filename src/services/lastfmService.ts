import { createLastfmSignature } from '../hooks/utils/credentialsUtils';
import type { LastfmTrackScrobble } from '../types';

const API_BASE = 'https://ws.audioscrobbler.com/2.0/';

const apiCall = async (params: Record<string, string>, secret?: string, method: 'GET' | 'POST' = 'GET') => {
  const allParams: Record<string, string> = { ...params, format: 'json' };

  if (secret) {
    const signature = createLastfmSignature(params, secret);
    allParams.api_sig = signature;
  }

  const searchParams = new URLSearchParams(allParams);
  const url = `${API_BASE}?${searchParams.toString()}`;

  const response = await fetch(url, { method });
  const data = await response.json();

  if (data.error) {
    throw new Error(`Last.fm API Error: ${data.message} (code: ${data.error})`);
  }

  return data;
};

export const getLastfmSession = async (apiKey: string, secret: string, token: string) => {
  const params = {
    method: 'auth.getsession',
    api_key: apiKey,
    token,
  };
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
    params[`timestamp[${index}]`] = track.timestamp.toString();
  });
  
  const data = await apiCall(params, secret, 'POST');
  return data.scrobbles;
};