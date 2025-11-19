import { useState, useEffect } from 'react';
import { getAccessToken, getDiscogsIdentity, getRequestToken } from '../services/discogsService';
import { getLastfmSession } from '../services/lastfmService';
import type { Credentials } from '../types';

const LASTFM_API_KEY = '8905f463b5d9e0cd0bbda00b274f8dc0';
const LASTFM_SECRET = 'e1e800587e275d6dc0fe3373fd4a6ab9';
const discogsRequestTokenSecretKey = 'hjbANmoLJUNBWoaCbJwcvKMruGKTduJPcErvkywc';

export function useAuthHandler(
  credentials: Credentials,
  onCredentialsChange: (credentials: Partial<Credentials>) => void
) {
  const [loadingService, setLoadingService] = useState<'discogs' | 'lastfm' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isLastfmConnected = !!credentials.lastfmSessionKey;

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const discogsOauthToken = urlParams.get('oauth_token');
    const discogsOauthVerifier = urlParams.get('oauth_verifier');
    const lastfmToken = urlParams.get('token');

    const completeDiscogsAuth = async (oauthToken: string, oauthVerifier: string) => {
      setLoadingService('discogs');
      setError(null);
      const requestTokenSecret = sessionStorage.getItem(discogsRequestTokenSecretKey);

      if (!requestTokenSecret) {
        setError('Discogs authentication session expired. Please try again.');
        setLoadingService(null);
        return;
      }
      
      try {
        const { accessToken, accessTokenSecret } = await getAccessToken(oauthToken, requestTokenSecret, oauthVerifier);
        const identity = await getDiscogsIdentity(accessToken, accessTokenSecret);
        
        onCredentialsChange({ 
          discogsUsername: identity.username, 
          discogsAccessToken: accessToken,
          discogsAccessTokenSecret: accessTokenSecret,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to finalize Discogs connection.');
      } finally {
        sessionStorage.removeItem(discogsRequestTokenSecretKey);
        window.history.replaceState({}, document.title, window.location.pathname);
        setLoadingService(null);
      }
    };

    const completeLastfmAuth = async (token: string) => {
      if (isLastfmConnected) {
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }

      setLoadingService('lastfm');
      setError(null);
      try {
        const session = await getLastfmSession(LASTFM_API_KEY, LASTFM_SECRET, token);
        onCredentialsChange({ 
          lastfmApiKey: LASTFM_API_KEY, 
          lastfmSecret: LASTFM_SECRET, 
          lastfmSessionKey: session.key, 
          lastfmUsername: session.name 
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      } finally {
        window.history.replaceState({}, document.title, window.location.pathname);
        setLoadingService(null);
      }
    };
    
    if (discogsOauthToken && discogsOauthVerifier) {
      completeDiscogsAuth(discogsOauthToken, discogsOauthVerifier);
    } else if (lastfmToken) {
      completeLastfmAuth(lastfmToken);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDiscogsConnect = async () => {
    setLoadingService('discogs');
    setError(null);
    try {
      const { requestToken, requestTokenSecret, authorizeUrl } = await getRequestToken();
      sessionStorage.setItem(discogsRequestTokenSecretKey, requestTokenSecret);
      window.location.href = authorizeUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start Discogs authentication.');
      setLoadingService(null);
    }
  };

  const handleLastfmConnect = () => {
    setLoadingService('lastfm');
    setError(null);
    try {
      const callbackUrl = window.location.href.split('?')[0];
      const authUrl = `https://www.last.fm/api/auth/?api_key=${LASTFM_API_KEY}&cb=${encodeURIComponent(callbackUrl)}`;
      window.location.href = authUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      setLoadingService(null);
    }
  };

  return {
    loadingService,
    error,
    setError,
    handleDiscogsConnect,
    handleLastfmConnect,
  };
}