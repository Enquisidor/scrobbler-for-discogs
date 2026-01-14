import { useSecureStorage } from '../useSecureStorage';
import type { Credentials } from 'scrobbler-for-discogs-libs';

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
 */
export function useCredentials() {
  const [credentials, setCredentials, { isLoading, removeValue }] = useSecureStorage<Credentials>(
    'vinyl-scrobbler-credentials',
    initialCredentials
  );

  const onCredentialsChange = async (newCredentials: Partial<Credentials>) => {
    await setCredentials((prev) => ({ ...prev, ...newCredentials }));
  };

  const handleDiscogsLogout = async () => {
    await setCredentials((prev) => ({
      ...prev,
      discogsUsername: '',
      discogsAccessToken: '',
      discogsAccessTokenSecret: '',
    }));
  };

  const handleLastfmLogout = async () => {
    await setCredentials((prev) => ({
      ...prev,
      lastfmApiKey: '',
      lastfmSecret: '',
      lastfmSessionKey: '',
      lastfmUsername: '',
    }));
  };

  const clearAllCredentials = async () => {
    await removeValue();
  };

  return {
    credentials,
    isLoading,
    onCredentialsChange,
    handleDiscogsLogout,
    handleLastfmLogout,
    clearAllCredentials,
  };
}
