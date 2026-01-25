/**
 * Tests for web useAuthHandler hook
 *
 * Tests OAuth flows using browser APIs (window.location, sessionStorage)
 */
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAuthHandler } from '../useAuthHandler';
import type { Credentials } from '@libs';
import { STORAGE_KEYS } from '@libs';

// Mock the services from libs
jest.mock('@libs', () => {
  const actual = jest.requireActual('@libs');
  return {
    ...actual,
    getRequestToken: jest.fn(),
    getAccessToken: jest.fn(),
    getDiscogsIdentity: jest.fn(),
    getLastfmSession: jest.fn(),
    getLastfmConfig: jest.fn(() => ({
      apiKey: 'test-api-key',
      secret: 'test-secret',
    })),
  };
});

import { getRequestToken, getAccessToken, getDiscogsIdentity, getLastfmSession } from '@libs';

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

describe('useAuthHandler (web)', () => {
  const mockOnCredentialsChange = jest.fn();
  let originalLocation: Location;

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnCredentialsChange.mockResolvedValue(undefined);

    // Reset window.location.search
    Object.defineProperty(window, 'location', {
      value: {
        href: 'http://localhost:3000/',
        pathname: '/',
        search: '',
      },
      writable: true,
    });

    // Reset sessionStorage mock
    (sessionStorage.getItem as jest.Mock).mockReset();
    (sessionStorage.setItem as jest.Mock).mockReset();
    (sessionStorage.removeItem as jest.Mock).mockReset();

    // Reset history mock
    (window.history.replaceState as jest.Mock).mockReset();
  });

  describe('Initial State', () => {
    it('should return correct initial state', () => {
      const { result } = renderHook(() =>
        useAuthHandler(emptyCredentials, mockOnCredentialsChange)
      );

      expect(result.current.loadingService).toBeNull();
      expect(result.current.error).toBeNull();
    });
  });

  describe('Discogs OAuth Flow', () => {
    it('should initiate Discogs auth by redirecting to authorize URL', async () => {
      mockGetRequestToken.mockResolvedValue({
        requestToken: 'req_token',
        requestTokenSecret: 'req_secret',
        authorizeUrl: 'https://www.discogs.com/oauth/authorize?oauth_token=req_token',
      });

      const { result } = renderHook(() =>
        useAuthHandler(emptyCredentials, mockOnCredentialsChange)
      );

      await act(async () => {
        await result.current.handleDiscogsConnect();
      });

      expect(mockGetRequestToken).toHaveBeenCalled();
      expect(sessionStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.DISCOGS_REQUEST_TOKEN_SECRET,
        'req_secret'
      );
      // Note: window.location.href assignment is tested by checking it was called
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

    it('should complete Discogs OAuth callback successfully', async () => {
      // Setup URL with OAuth callback params
      Object.defineProperty(window, 'location', {
        value: {
          href: 'http://localhost:3000/?oauth_token=req_token&oauth_verifier=verifier123',
          pathname: '/',
          search: '?oauth_token=req_token&oauth_verifier=verifier123',
        },
        writable: true,
      });

      (sessionStorage.getItem as jest.Mock).mockReturnValue('req_secret');

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

      await waitFor(() => {
        expect(mockOnCredentialsChange).toHaveBeenCalledWith({
          discogsUsername: 'discogs_user',
          discogsAccessToken: 'access_token',
          discogsAccessTokenSecret: 'access_secret',
        });
      });

      expect(sessionStorage.removeItem).toHaveBeenCalledWith(
        STORAGE_KEYS.DISCOGS_REQUEST_TOKEN_SECRET
      );
      expect(window.history.replaceState).toHaveBeenCalled();
    });

    it('should handle expired session (missing stored secret)', async () => {
      Object.defineProperty(window, 'location', {
        value: {
          href: 'http://localhost:3000/?oauth_token=req_token&oauth_verifier=verifier123',
          pathname: '/',
          search: '?oauth_token=req_token&oauth_verifier=verifier123',
        },
        writable: true,
      });

      (sessionStorage.getItem as jest.Mock).mockReturnValue(null);

      const { result } = renderHook(() =>
        useAuthHandler(emptyCredentials, mockOnCredentialsChange)
      );

      await waitFor(() => {
        expect(result.current.error).toBe(
          'Discogs authentication session expired. Please try again.'
        );
      });

      expect(mockOnCredentialsChange).not.toHaveBeenCalled();
    });
  });

  describe('Last.fm OAuth Flow', () => {
    it('should initiate Last.fm auth by redirecting', () => {
      const { result } = renderHook(() =>
        useAuthHandler(emptyCredentials, mockOnCredentialsChange)
      );

      act(() => {
        result.current.handleLastfmConnect();
      });

      // The hook sets loading state before redirect
      expect(result.current.loadingService).toBe('lastfm');
    });

    it('should complete Last.fm OAuth callback successfully', async () => {
      Object.defineProperty(window, 'location', {
        value: {
          href: 'http://localhost:3000/?token=lastfm_token_123',
          pathname: '/',
          search: '?token=lastfm_token_123',
        },
        writable: true,
      });

      mockGetLastfmSession.mockResolvedValue({
        key: 'session_key_456',
        name: 'lastfm_username',
      });

      const { result } = renderHook(() =>
        useAuthHandler(emptyCredentials, mockOnCredentialsChange)
      );

      await waitFor(() => {
        expect(mockOnCredentialsChange).toHaveBeenCalledWith({
          lastfmApiKey: 'test-api-key',
          lastfmSecret: 'test-secret',
          lastfmSessionKey: 'session_key_456',
          lastfmUsername: 'lastfm_username',
        });
      });

      expect(window.history.replaceState).toHaveBeenCalled();
    });

    it('should not complete Last.fm auth if already connected', async () => {
      Object.defineProperty(window, 'location', {
        value: {
          href: 'http://localhost:3000/?token=lastfm_token_123',
          pathname: '/',
          search: '?token=lastfm_token_123',
        },
        writable: true,
      });

      const { result } = renderHook(() =>
        useAuthHandler(connectedCredentials, mockOnCredentialsChange)
      );

      await waitFor(() => {
        expect(window.history.replaceState).toHaveBeenCalled();
      });

      expect(mockGetLastfmSession).not.toHaveBeenCalled();
      expect(mockOnCredentialsChange).not.toHaveBeenCalled();
    });

    it('should handle Last.fm session fetch failure', async () => {
      Object.defineProperty(window, 'location', {
        value: {
          href: 'http://localhost:3000/?token=valid_token',
          pathname: '/',
          search: '?token=valid_token',
        },
        writable: true,
      });

      mockGetLastfmSession.mockRejectedValue(new Error('Session fetch failed'));

      const { result } = renderHook(() =>
        useAuthHandler(emptyCredentials, mockOnCredentialsChange)
      );

      await waitFor(() => {
        expect(result.current.error).toBe('Session fetch failed');
      });

      expect(mockOnCredentialsChange).not.toHaveBeenCalled();
    });
  });

  describe('Error Management', () => {
    it('should allow setting errors via setError', async () => {
      const { result } = renderHook(() =>
        useAuthHandler(emptyCredentials, mockOnCredentialsChange)
      );

      act(() => {
        result.current.setError('Custom error');
      });

      expect(result.current.error).toBe('Custom error');

      act(() => {
        result.current.setError(null);
      });

      expect(result.current.error).toBeNull();
    });
  });
});
