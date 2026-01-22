import { useState, useEffect, useRef } from 'react';
import { getLastfmConfig, STORAGE_KEYS, getLastfmSession, getAccessToken, getDiscogsIdentity, getRequestToken } from '@libs';
import type { Credentials } from '@libs';

export function useAuthHandler(
  credentials: Credentials,
  onCredentialsChange: (credentials: Partial<Credentials>) => void
) {
  const [loadingService, setLoadingService] = useState<'discogs' | 'lastfm' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const effectRan = useRef(false);

  const isLastfmConnected = !!credentials.lastfmSessionKey;

  useEffect(() => {
    if (effectRan.current) return;

    const urlParams = new URLSearchParams(window.location.search);
    const discogsOauthToken = urlParams.get('oauth_token');
    const discogsOauthVerifier = urlParams.get('oauth_verifier');
    const lastfmToken = urlParams.get('token');

    const completeDiscogsAuth = async (oauthToken: string, oauthVerifier: string) => {
      setLoadingService('discogs');
      setError(null);
      const requestTokenSecret = sessionStorage.getItem(STORAGE_KEYS.DISCOGS_REQUEST_TOKEN_SECRET);

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
        console.error(err);
        setError(err instanceof Error ? err.message : 'Failed to finalize Discogs connection.');
      } finally {
        sessionStorage.removeItem(STORAGE_KEYS.DISCOGS_REQUEST_TOKEN_SECRET);
        window.history.replaceState({}, document.title, window.location.pathname);
        setLoadingService(null);
      }
    };

    const completeLastfmAuth = async (token: string) => {
      if (isLastfmConnected) {
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }

      const { apiKey, secret } = getLastfmConfig();
      setLoadingService('lastfm');
      setError(null);
      try {
        const session = await getLastfmSession(apiKey, secret, token);
        onCredentialsChange({
          lastfmApiKey: apiKey,
          lastfmSecret: secret,
          lastfmSessionKey: session.key,
          lastfmUsername: session.name
        });
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      } finally {
        window.history.replaceState({}, document.title, window.location.pathname);
        setLoadingService(null);
      }
    };

    if (discogsOauthToken && discogsOauthVerifier) {
      effectRan.current = true;
      completeDiscogsAuth(discogsOauthToken, discogsOauthVerifier);
    } else if (lastfmToken) {
      effectRan.current = true;
      completeLastfmAuth(lastfmToken);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDiscogsConnect = async () => {
    setLoadingService('discogs');
    setError(null);
    try {
      const { requestTokenSecret, authorizeUrl } = await getRequestToken("");
      sessionStorage.setItem(STORAGE_KEYS.DISCOGS_REQUEST_TOKEN_SECRET, requestTokenSecret);
      window.location.href = authorizeUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start Discogs authentication.');
      setLoadingService(null);
    }
  };

  const handleLastfmConnect = () => {
    const { apiKey } = getLastfmConfig();
    setLoadingService('lastfm');
    setError(null);
    try {
      const callbackUrl = window.location.href.split('?')[0];
      const authUrl = `https://www.last.fm/api/auth/?api_key=${apiKey}&cb=${encodeURIComponent(callbackUrl)}`;
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
