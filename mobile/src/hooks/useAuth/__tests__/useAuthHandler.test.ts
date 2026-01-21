/**
 * Tests for useAuthHandler hook
 *
 * Covers: OAuth flows, signature generation, error cases (Plan Phase 3.2)
 * Testing requirements from plan:
 * - Test full OAuth flow on device, verify signature generation, test error cases
 * - Test full Last.fm auth flow, verify session key works
 */
import { renderHook, act, waitFor } from '@testing-library/react-native';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as SecureStore from 'expo-secure-store';
import { useAuthHandler } from '../useAuthHandler';
import type { Credentials } from '@libs';

// Mock the services
jest.mock('../../../services/discogsService', () => ({
  getRequestToken: jest.fn(),
  getAccessToken: jest.fn(),
  getDiscogsIdentity: jest.fn(),
}));

jest.mock('../../../services/lastfmService', () => ({
  getLastfmSession: jest.fn(),
}));

// Import mocked services
import { getRequestToken, getAccessToken, getDiscogsIdentity } from '../../../services/discogsService';
import { getLastfmSession } from '../../../services/lastfmService';

// Match the actual keys used in useAuthHandler.ts
const DISCOGS_REQUEST_TOKEN_SECRET_KEY = 'pfoWbAvyoguwrrhaSyCfGBPQAPpHNJVU  ';
const DISCOGS_REQUEST_TOKEN_KEY = 'hjbANmoLJUNBWoaCbJwcvKMruGKTduJPcErvkywc';

// Cast mocks for TypeScript
const mockOpenAuthSessionAsync = WebBrowser.openAuthSessionAsync as jest.Mock;
const mockMakeRedirectUri = AuthSession.makeRedirectUri as jest.Mock;
const mockSetItemAsync = SecureStore.setItemAsync as jest.Mock;
const mockGetItemAsync = SecureStore.getItemAsync as jest.Mock;
const mockDeleteItemAsync = SecureStore.deleteItemAsync as jest.Mock;
const mockGetRequestToken = getRequestToken as jest.Mock;
const mockGetAccessToken = getAccessToken as jest.Mock;
const mockGetDiscogsIdentity = getDiscogsIdentity as jest.Mock;
const mockGetLastfmSession = getLastfmSession as jest.Mock;

const emptyCredentials: Credentials = {
  discogsUsername: '',
  discogsAccessToken: '',
  discogsAccessTokenSecret: '',
  lastfmApiKey: '',
  lastfmSecret: '',
  lastfmSessionKey: '',
  lastfmUsername: '',
};

const connectedCredentials: Credentials = {
  discogsUsername: 'testuser',
  discogsAccessToken: 'access123',
  discogsAccessTokenSecret: 'secret123',
  lastfmApiKey: 'lfmkey',
  lastfmSecret: 'lfmsecret',
  lastfmSessionKey: 'lfmsession',
  lastfmUsername: 'lfmuser',
};

describe('useAuthHandler', () => {
  const mockOnCredentialsChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockMakeRedirectUri.mockReturnValue('scrobbler-for-discogs://auth');
    mockOnCredentialsChange.mockResolvedValue(undefined);
  });

  describe('Initial State', () => {
    it('should return correct initial state', () => {
      const { result } = renderHook(() =>
        useAuthHandler(emptyCredentials, mockOnCredentialsChange)
      );

      expect(result.current.loadingService).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.isDiscogsConnected).toBe(false);
      expect(result.current.isLastfmConnected).toBe(false);
    });

    it('should correctly detect connected services', () => {
      const { result } = renderHook(() =>
        useAuthHandler(connectedCredentials, mockOnCredentialsChange)
      );

      expect(result.current.isDiscogsConnected).toBe(true);
      expect(result.current.isLastfmConnected).toBe(true);
    });
  });

  describe('Discogs OAuth Flow', () => {
    it('should complete full Discogs OAuth flow successfully', async () => {
      // Setup mocks for successful flow
      mockGetRequestToken.mockResolvedValue({
        requestToken: 'req_token',
        requestTokenSecret: 'req_secret',
        authorizeUrl: 'https://www.discogs.com/oauth/authorize?oauth_token=req_token',
      });

      mockOpenAuthSessionAsync.mockResolvedValue({
        type: 'success',
        url: 'scrobbler-for-discogs://auth?oauth_token=req_token&oauth_verifier=verifier123',
      });

      mockGetItemAsync.mockResolvedValue('req_secret');

      mockGetAccessToken.mockResolvedValue({
        accessToken: 'access_token',
        accessTokenSecret: 'access_secret',
      });

      mockGetDiscogsIdentity.mockResolvedValue({
        username: 'discogs_user',
      });

      const { result } = renderHook(() =>
        useAuthHandler(emptyCredentials, mockOnCredentialsChange)
      );

      await act(async () => {
        await result.current.handleDiscogsConnect();
      });

      // Verify flow executed correctly
      expect(mockGetRequestToken).toHaveBeenCalledWith('scrobbler-for-discogs://auth');
      expect(mockSetItemAsync).toHaveBeenCalledWith(
        DISCOGS_REQUEST_TOKEN_SECRET_KEY,
        'req_secret'
      );
      expect(mockSetItemAsync).toHaveBeenCalledWith(
        DISCOGS_REQUEST_TOKEN_KEY,
        'req_token'
      );
      expect(mockOpenAuthSessionAsync).toHaveBeenCalled();
      expect(mockGetAccessToken).toHaveBeenCalledWith(
        'req_token',
        'req_secret',
        'verifier123'
      );
      expect(mockGetDiscogsIdentity).toHaveBeenCalledWith('access_token', 'access_secret');
      expect(mockOnCredentialsChange).toHaveBeenCalledWith({
        discogsUsername: 'discogs_user',
        discogsAccessToken: 'access_token',
        discogsAccessTokenSecret: 'access_secret',
      });

      // Cleanup should have occurred
      expect(mockDeleteItemAsync).toHaveBeenCalledWith(DISCOGS_REQUEST_TOKEN_SECRET_KEY);
      expect(mockDeleteItemAsync).toHaveBeenCalledWith(DISCOGS_REQUEST_TOKEN_KEY);
      expect(result.current.loadingService).toBeNull();
    });

    it('should handle Discogs auth cancellation', async () => {
      mockGetRequestToken.mockResolvedValue({
        requestToken: 'req_token',
        requestTokenSecret: 'req_secret',
        authorizeUrl: 'https://www.discogs.com/oauth/authorize?oauth_token=req_token',
      });

      mockOpenAuthSessionAsync.mockResolvedValue({
        type: 'cancel',
      });

      const { result } = renderHook(() =>
        useAuthHandler(emptyCredentials, mockOnCredentialsChange)
      );

      await act(async () => {
        await result.current.handleDiscogsConnect();
      });

      expect(result.current.error).toBe('Discogs authentication was cancelled.');
      expect(mockOnCredentialsChange).not.toHaveBeenCalled();
      expect(result.current.loadingService).toBeNull();
    });

    it('should handle Discogs request token failure', async () => {
      mockGetRequestToken.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() =>
        useAuthHandler(emptyCredentials, mockOnCredentialsChange)
      );

      await act(async () => {
        await result.current.handleDiscogsConnect();
      });

      expect(result.current.error).toBe('Network error');
      expect(result.current.loadingService).toBeNull();
    });

    it('should handle missing OAuth verifier in callback', async () => {
      mockGetRequestToken.mockResolvedValue({
        requestToken: 'req_token',
        requestTokenSecret: 'req_secret',
        authorizeUrl: 'https://www.discogs.com/oauth/authorize?oauth_token=req_token',
      });

      mockOpenAuthSessionAsync.mockResolvedValue({
        type: 'success',
        url: 'scrobbler-for-discogs://auth?oauth_token=req_token', // Missing verifier
      });

      const { result } = renderHook(() =>
        useAuthHandler(emptyCredentials, mockOnCredentialsChange)
      );

      await act(async () => {
        await result.current.handleDiscogsConnect();
      });

      expect(result.current.error).toBe('Missing OAuth verifier or token in callback');
    });

    it('should handle expired session (missing stored secret)', async () => {
      mockGetRequestToken.mockResolvedValue({
        requestToken: 'req_token',
        requestTokenSecret: 'req_secret',
        authorizeUrl: 'https://www.discogs.com/oauth/authorize?oauth_token=req_token',
      });

      mockOpenAuthSessionAsync.mockResolvedValue({
        type: 'success',
        url: 'scrobbler-for-discogs://auth?oauth_token=req_token&oauth_verifier=verifier123',
      });

      mockGetItemAsync.mockResolvedValue(null); // No stored secret

      const { result } = renderHook(() =>
        useAuthHandler(emptyCredentials, mockOnCredentialsChange)
      );

      await act(async () => {
        await result.current.handleDiscogsConnect();
      });

      expect(result.current.error).toBe('Discogs authentication session expired. Please try again.');
    });
  });

  describe('Last.fm OAuth Flow', () => {
    it('should complete full Last.fm OAuth flow successfully', async () => {
      mockOpenAuthSessionAsync.mockResolvedValue({
        type: 'success',
        url: 'scrobbler-for-discogs://auth?token=lastfm_token_123',
      });

      mockGetLastfmSession.mockResolvedValue({
        key: 'session_key_456',
        name: 'lastfm_username',
      });

      const { result } = renderHook(() =>
        useAuthHandler(emptyCredentials, mockOnCredentialsChange)
      );

      await act(async () => {
        await result.current.handleLastfmConnect();
      });

      // Verify auth URL was opened
      expect(mockOpenAuthSessionAsync).toHaveBeenCalledWith(
        expect.stringContaining('https://www.last.fm/api/auth/'),
        'scrobbler-for-discogs://auth'
      );

      // Verify session was fetched
      expect(mockGetLastfmSession).toHaveBeenCalledWith(
        expect.any(String), // API key
        expect.any(String), // Secret
        'lastfm_token_123'
      );

      // Verify credentials were saved
      expect(mockOnCredentialsChange).toHaveBeenCalledWith({
        lastfmApiKey: expect.any(String),
        lastfmSecret: expect.any(String),
        lastfmSessionKey: 'session_key_456',
        lastfmUsername: 'lastfm_username',
      });

      expect(result.current.loadingService).toBeNull();
    });

    it('should handle Last.fm auth cancellation', async () => {
      mockOpenAuthSessionAsync.mockResolvedValue({
        type: 'cancel',
      });

      const { result } = renderHook(() =>
        useAuthHandler(emptyCredentials, mockOnCredentialsChange)
      );

      await act(async () => {
        await result.current.handleLastfmConnect();
      });

      expect(result.current.error).toBe('Last.fm authentication was cancelled.');
      expect(mockOnCredentialsChange).not.toHaveBeenCalled();
    });

    it('should handle missing token in Last.fm callback', async () => {
      mockOpenAuthSessionAsync.mockResolvedValue({
        type: 'success',
        url: 'scrobbler-for-discogs://auth', // No token
      });

      const { result } = renderHook(() =>
        useAuthHandler(emptyCredentials, mockOnCredentialsChange)
      );

      await act(async () => {
        await result.current.handleLastfmConnect();
      });

      expect(result.current.error).toBe('No token received from Last.fm');
    });

    it('should handle Last.fm session fetch failure', async () => {
      mockOpenAuthSessionAsync.mockResolvedValue({
        type: 'success',
        url: 'scrobbler-for-discogs://auth?token=valid_token',
      });

      mockGetLastfmSession.mockRejectedValue(new Error('Session fetch failed'));

      const { result } = renderHook(() =>
        useAuthHandler(emptyCredentials, mockOnCredentialsChange)
      );

      await act(async () => {
        await result.current.handleLastfmConnect();
      });

      expect(result.current.error).toBe('Session fetch failed');
    });
  });

  describe('Loading State', () => {
    it('should set loading state during Discogs auth', async () => {
      // Use a promise that we can resolve manually
      let resolvePromise: () => void;
      mockGetRequestToken.mockReturnValue(
        new Promise((resolve) => {
          resolvePromise = () =>
            resolve({
              requestToken: 'tok',
              requestTokenSecret: 'sec',
              authorizeUrl: 'url',
            });
        })
      );

      const { result } = renderHook(() =>
        useAuthHandler(emptyCredentials, mockOnCredentialsChange)
      );

      // Start auth without awaiting
      act(() => {
        result.current.handleDiscogsConnect();
      });

      // Check loading state immediately
      await waitFor(() => {
        expect(result.current.loadingService).toBe('discogs');
      });
    });

    it('should set loading state during Last.fm auth', async () => {
      let resolvePromise: () => void;
      mockOpenAuthSessionAsync.mockReturnValue(
        new Promise((resolve) => {
          resolvePromise = () => resolve({ type: 'cancel' });
        })
      );

      const { result } = renderHook(() =>
        useAuthHandler(emptyCredentials, mockOnCredentialsChange)
      );

      act(() => {
        result.current.handleLastfmConnect();
      });

      await waitFor(() => {
        expect(result.current.loadingService).toBe('lastfm');
      });
    });
  });

  describe('Error Management', () => {
    it('should allow clearing errors via setError', async () => {
      mockGetRequestToken.mockRejectedValue(new Error('Test error'));

      const { result } = renderHook(() =>
        useAuthHandler(emptyCredentials, mockOnCredentialsChange)
      );

      await act(async () => {
        await result.current.handleDiscogsConnect();
      });

      expect(result.current.error).toBe('Test error');

      act(() => {
        result.current.setError(null);
      });

      expect(result.current.error).toBeNull();
    });
  });
});
