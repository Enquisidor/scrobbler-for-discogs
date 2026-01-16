import { useStorage } from '../useStorage';
import type { Credentials } from '../../libs';

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
  const [credentials, setCredentials, { isLoading, removeValue }] = useStorage<Credentials>(
    'vinyl-scrobbler-credentials',
    initialCredentials,
    { secure: true }
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
