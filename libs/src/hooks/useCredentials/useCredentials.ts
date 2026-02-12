import { useEffect, useRef, useCallback } from 'react';
import { useStorage } from '../useStorage/useStorage';
import type { Credentials } from '../../types';
import { STORAGE_KEYS, CREDENTIALS_EXPIRY_MS } from '../../config';

const initialCredentials: Credentials = {
  discogsUsername: '',
  discogsAccessToken: '',
  discogsAccessTokenSecret: '',
  lastfmApiKey: '',
  lastfmSecret: '',
  lastfmSessionKey: '',
  lastfmUsername: '',
};

/**
 * Mobile credential management hook using secure storage.
 * Provides credential state and methods to update or clear credentials.
 * Credentials expire after 7 days of inactivity.
 */
export function useCredentials() {
  const [credentials, setCredentials, { isLoading, removeValue }] = useStorage<Credentials>(
    'scrobbler-for-discogs-credentials',
    initialCredentials,
    { secure: true }
  );

  const [lastActivity, setLastActivity] = useStorage<number>(
    STORAGE_KEYS.CREDENTIALS_LAST_ACTIVITY,
    0,
    { secure: false }
  );

  const hasCheckedExpiry = useRef(false);

  // Check for credential expiry on mount
  useEffect(() => {
    if (isLoading || hasCheckedExpiry.current) return;
    hasCheckedExpiry.current = true;

    const hasCredentials = credentials.discogsAccessToken || credentials.lastfmSessionKey;
    if (!hasCredentials) return;

    const now = Date.now();
    const isExpired = lastActivity > 0 && (now - lastActivity) > CREDENTIALS_EXPIRY_MS;

    if (isExpired) {
      console.log('Credentials expired due to inactivity, clearing...');
      removeValue();
      setLastActivity(0);
    }
  }, [isLoading, credentials, lastActivity, removeValue, setLastActivity]);

  // Update last activity timestamp
  const updateLastActivity = useCallback(async () => {
    await setLastActivity(Date.now());
  }, [setLastActivity]);

  const onCredentialsChange = useCallback(async (newCredentials: Partial<Credentials>) => {
    await setCredentials((prev) => ({ ...prev, ...newCredentials }));
    await updateLastActivity();
  }, [setCredentials, updateLastActivity]);

  const handleDiscogsLogout = useCallback(async () => {
    await setCredentials((prev) => ({
      ...prev,
      discogsUsername: '',
      discogsAccessToken: '',
      discogsAccessTokenSecret: '',
    }));
  }, [setCredentials]);

  const handleLastfmLogout = useCallback(async () => {
    await setCredentials((prev) => ({
      ...prev,
      lastfmApiKey: '',
      lastfmSecret: '',
      lastfmSessionKey: '',
      lastfmUsername: '',
    }));
  }, [setCredentials]);

  const clearAllCredentials = useCallback(async () => {
    await removeValue();
    await setLastActivity(0);
  }, [removeValue, setLastActivity]);

  return {
    credentials,
    isLoading,
    onCredentialsChange,
    handleDiscogsLogout,
    handleLastfmLogout,
    clearAllCredentials,
    updateLastActivity,
  };
}
