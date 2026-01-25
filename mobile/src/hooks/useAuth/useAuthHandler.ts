import { useState, useCallback, useRef } from 'react';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as SecureStore from 'expo-secure-store';
import { getAccessToken, getDiscogsIdentity, getRequestToken } from '../../../../libs/src/services/discogsService';
import { getLastfmSession } from '../../../../libs/src/services/lastfmService';
import type { Credentials } from '../../../../libs/src/types';
import { getLastfmConfig, STORAGE_KEYS } from '../../../../libs/src';

// Ensure browser sessions are properly cleaned up
WebBrowser.maybeCompleteAuthSession();

/**
 * Mobile authentication handler using expo-auth-session.
 * Handles OAuth flows for Discogs (OAuth 1.0a) and Last.fm.
 */
export function useAuthHandler(
  credentials: Credentials,
  onCredentialsChange: (credentials: Partial<Credentials>) => Promise<void>
) {
  const [loadingService, setLoadingService] = useState<'discogs' | 'lastfm' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const processingRef = useRef(false);

  const isDiscogsConnected = !!credentials.discogsAccessToken;
  const isLastfmConnected = !!credentials.lastfmSessionKey;

  // Create redirect URI for the app
  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'scrobbler-for-discogs',
    path: 'auth',
  });

  // Handle Discogs OAuth 1.0a connect
  const handleDiscogsConnect = useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;
    setLoadingService('discogs');
    setError(null);

    try {
      // Step 1: Get request token
      const { requestToken, requestTokenSecret, authorizeUrl } = await getRequestToken(redirectUri);

      // Store the request token secret for later use
      await SecureStore.setItemAsync(STORAGE_KEYS.DISCOGS_REQUEST_TOKEN_SECRET, requestTokenSecret);
      await SecureStore.setItemAsync(STORAGE_KEYS.DISCOGS_REQUEST_TOKEN, requestToken);

      // Step 2: Open browser for user authorization
      const result = await WebBrowser.openAuthSessionAsync(
        authorizeUrl,
        redirectUri
      );

      if (result.type === 'success' && result.url) {
        // Step 3: Extract oauth_verifier from callback URL
        const url = new URL(result.url);
        const oauthVerifier = url.searchParams.get('oauth_verifier');
        const returnedToken = url.searchParams.get('oauth_token');

        if (!oauthVerifier || !returnedToken) {
          throw new Error('Missing OAuth verifier or token in callback');
        }

        // Get stored request token secret
        const storedSecret = await SecureStore.getItemAsync(STORAGE_KEYS.DISCOGS_REQUEST_TOKEN_SECRET);
        if (!storedSecret) {
          throw new Error('Discogs authentication session expired. Please try again.');
        }

        // Step 4: Exchange for access token
        const { accessToken, accessTokenSecret } = await getAccessToken(
          returnedToken,
          storedSecret,
          oauthVerifier
        );

        // Step 5: Get user identity
        const identity = await getDiscogsIdentity(accessToken, accessTokenSecret);

        // Step 6: Save credentials
        await onCredentialsChange({
          discogsUsername: identity.username,
          discogsAccessToken: accessToken,
          discogsAccessTokenSecret: accessTokenSecret,
        });
      } else if (result.type === 'cancel') {
        setError('Discogs authentication was cancelled.');
      }
    } catch (err) {
      console.error('Discogs auth error:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect to Discogs.');
    } finally {
      // Clean up stored tokens
      await SecureStore.deleteItemAsync(STORAGE_KEYS.DISCOGS_REQUEST_TOKEN_SECRET);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.DISCOGS_REQUEST_TOKEN);
      setLoadingService(null);
      processingRef.current = false;
    }
  }, [redirectUri, onCredentialsChange]);

  // Handle Last.fm OAuth connect
  const handleLastfmConnect = useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;
    setLoadingService('lastfm');
    setError(null);

    try {
      const { apiKey, secret } = getLastfmConfig();
      const authUrl = `https://www.last.fm/api/auth/?api_key=${apiKey}&cb=${encodeURIComponent(redirectUri)}`;

      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        redirectUri
      );

      if (result.type === 'success' && result.url) {
        // Extract token from callback URL
        const url = new URL(result.url);
        const token = url.searchParams.get('token');

        if (!token) {
          throw new Error('No token received from Last.fm');
        }

        // Get session key
        const session = await getLastfmSession(apiKey, secret, token);

        if (!session) {
          throw new Error('Failed to get Last.fm session');
        }

        // Save credentials
        await onCredentialsChange({
          lastfmApiKey: apiKey,
          lastfmSecret: secret,
          lastfmSessionKey: session.key,
          lastfmUsername: session.name,
        });
      } else if (result.type === 'cancel') {
        setError('Last.fm authentication was cancelled.');
      }
    } catch (err) {
      console.error('Last.fm auth error:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect to Last.fm.');
    } finally {
      setLoadingService(null);
      processingRef.current = false;
    }
  }, [redirectUri, onCredentialsChange]);

  return {
    loadingService,
    error,
    setError,
    isDiscogsConnected,
    isLastfmConnected,
    handleDiscogsConnect,
    handleLastfmConnect,
  };
}
