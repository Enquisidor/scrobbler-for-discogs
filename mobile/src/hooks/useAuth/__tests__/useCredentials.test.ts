/**
 * Tests for useCredentials hook
 *
 * Covers: Credential save/load, secure storage, logout flows (Plan Phase 2.6)
 */
import { renderHook, act, waitFor } from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import { useCredentials } from '../useCredentials';
import type { Credentials } from 'scrobbler-for-discogs-libs';

// Cast mocks for TypeScript
const mockGetItemAsync = SecureStore.getItemAsync as jest.Mock;
const mockSetItemAsync = SecureStore.setItemAsync as jest.Mock;
const mockDeleteItemAsync = SecureStore.deleteItemAsync as jest.Mock;

const initialCredentials: Credentials = {
  discogsUsername: '',
  discogsAccessToken: '',
  discogsAccessTokenSecret: '',
  lastfmApiKey: '',
  lastfmSecret: '',
  lastfmSessionKey: '',
  lastfmUsername: '',
};

const storedCredentials: Credentials = {
  discogsUsername: 'testuser',
  discogsAccessToken: 'access123',
  discogsAccessTokenSecret: 'secret123',
  lastfmApiKey: 'lfmkey',
  lastfmSecret: 'lfmsecret',
  lastfmSessionKey: 'lfmsession',
  lastfmUsername: 'lfmuser',
};

describe('useCredentials', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial Load', () => {
    it('should return initial empty credentials when storage is empty', async () => {
      mockGetItemAsync.mockResolvedValue(null);

      const { result } = renderHook(() => useCredentials());

      // Initially loading
      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.credentials).toEqual(initialCredentials);
    });

    it('should load stored credentials from SecureStore', async () => {
      mockGetItemAsync.mockResolvedValue(JSON.stringify(storedCredentials));

      const { result } = renderHook(() => useCredentials());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.credentials).toEqual(storedCredentials);
      expect(mockGetItemAsync).toHaveBeenCalledWith('vinyl-scrobbler-credentials');
    });
  });

  describe('Credential Updates', () => {
    it('should update credentials via onCredentialsChange', async () => {
      mockGetItemAsync.mockResolvedValue(null);
      mockSetItemAsync.mockResolvedValue(undefined);

      const { result } = renderHook(() => useCredentials());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.onCredentialsChange({
          discogsUsername: 'newuser',
          discogsAccessToken: 'newtoken',
        });
      });

      expect(result.current.credentials.discogsUsername).toBe('newuser');
      expect(result.current.credentials.discogsAccessToken).toBe('newtoken');
      expect(mockSetItemAsync).toHaveBeenCalled();
    });

    it('should merge partial credential updates', async () => {
      mockGetItemAsync.mockResolvedValue(JSON.stringify(storedCredentials));
      mockSetItemAsync.mockResolvedValue(undefined);

      const { result } = renderHook(() => useCredentials());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.onCredentialsChange({
          lastfmUsername: 'newlfmuser',
        });
      });

      // Original Discogs credentials should remain
      expect(result.current.credentials.discogsUsername).toBe('testuser');
      // Last.fm username should be updated
      expect(result.current.credentials.lastfmUsername).toBe('newlfmuser');
    });
  });

  describe('Discogs Logout', () => {
    it('should clear only Discogs credentials on logout', async () => {
      mockGetItemAsync.mockResolvedValue(JSON.stringify(storedCredentials));
      mockSetItemAsync.mockResolvedValue(undefined);

      const { result } = renderHook(() => useCredentials());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.handleDiscogsLogout();
      });

      // Discogs credentials should be cleared
      expect(result.current.credentials.discogsUsername).toBe('');
      expect(result.current.credentials.discogsAccessToken).toBe('');
      expect(result.current.credentials.discogsAccessTokenSecret).toBe('');

      // Last.fm credentials should remain
      expect(result.current.credentials.lastfmSessionKey).toBe('lfmsession');
      expect(result.current.credentials.lastfmUsername).toBe('lfmuser');
    });
  });

  describe('Last.fm Logout', () => {
    it('should clear only Last.fm credentials on logout', async () => {
      mockGetItemAsync.mockResolvedValue(JSON.stringify(storedCredentials));
      mockSetItemAsync.mockResolvedValue(undefined);

      const { result } = renderHook(() => useCredentials());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.handleLastfmLogout();
      });

      // Last.fm credentials should be cleared
      expect(result.current.credentials.lastfmApiKey).toBe('');
      expect(result.current.credentials.lastfmSecret).toBe('');
      expect(result.current.credentials.lastfmSessionKey).toBe('');
      expect(result.current.credentials.lastfmUsername).toBe('');

      // Discogs credentials should remain
      expect(result.current.credentials.discogsUsername).toBe('testuser');
      expect(result.current.credentials.discogsAccessToken).toBe('access123');
    });
  });

  describe('Clear All Credentials', () => {
    it('should remove all credentials from storage', async () => {
      mockGetItemAsync.mockResolvedValue(JSON.stringify(storedCredentials));
      mockDeleteItemAsync.mockResolvedValue(undefined);

      const { result } = renderHook(() => useCredentials());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.clearAllCredentials();
      });

      expect(mockDeleteItemAsync).toHaveBeenCalledWith('vinyl-scrobbler-credentials');
      expect(result.current.credentials).toEqual(initialCredentials);
    });
  });

  describe('Credential Persistence', () => {
    it('should persist credentials across hook remounts', async () => {
      mockGetItemAsync.mockResolvedValue(JSON.stringify(storedCredentials));

      // First mount
      const { result, unmount } = renderHook(() => useCredentials());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.credentials.discogsUsername).toBe('testuser');

      // Unmount
      unmount();

      // Second mount - should load same credentials
      const { result: result2 } = renderHook(() => useCredentials());

      await waitFor(() => {
        expect(result2.current.isLoading).toBe(false);
      });

      expect(result2.current.credentials.discogsUsername).toBe('testuser');
      expect(mockGetItemAsync).toHaveBeenCalledTimes(2);
    });
  });
});
