/**
 * Tests for discogsService
 *
 * Priority 1 - Critical: OAuth 1.0a flow, API calls, retry logic, rate limit handling
 *
 * Note: Tests mock fetch - no actual API calls are made
 */
import {
  getRequestToken,
  getAccessToken,
  getDiscogsIdentity,
  fetchDiscogsPage,
  DiscogsAuthError,
  DiscogsRateLimitError,
} from '../discogsService';
import { createMockFetch, createMockCollectionResponse } from '../../__tests__/testUtils';

// Store original fetch
const originalFetch = global.fetch;

describe('discogsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('getRequestToken', () => {
    it('should return request token and authorize URL', async () => {
      const mockResponse = 'oauth_token=test_request_token&oauth_token_secret=test_secret&oauth_callback_confirmed=true';

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockResponse),
      });

      const result = await getRequestToken('scrobbler-for-discogs://auth');

      expect(result.requestToken).toBe('test_request_token');
      expect(result.requestTokenSecret).toBe('test_secret');
      expect(result.authorizeUrl).toContain('https://www.discogs.com/oauth/authorize');
      expect(result.authorizeUrl).toContain('oauth_token=test_request_token');
    });

    it('should throw error when request fails', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401,
      });

      await expect(getRequestToken('callback')).rejects.toThrow('Failed to get Discogs request token');
    });

    it('should throw error when response is missing tokens', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('invalid_response'),
      });

      await expect(getRequestToken('callback')).rejects.toThrow('Invalid request token response');
    });
  });

  describe('getAccessToken', () => {
    it('should exchange request token for access token', async () => {
      const mockResponse = 'oauth_token=access_token_123&oauth_token_secret=access_secret_456';

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockResponse),
      });

      const result = await getAccessToken('request_token', 'request_secret', 'verifier');

      expect(result.accessToken).toBe('access_token_123');
      expect(result.accessTokenSecret).toBe('access_secret_456');
    });

    it('should throw error when exchange fails', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401,
      });

      await expect(
        getAccessToken('token', 'secret', 'verifier')
      ).rejects.toThrow('Failed to get Discogs access token');
    });
  });

  describe('getDiscogsIdentity', () => {
    it('should return user identity', async () => {
      const mockIdentity = {
        id: 12345,
        username: 'testuser',
        resource_url: 'https://api.discogs.com/users/testuser',
        consumer_name: 'VinylScrobbler',
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockIdentity),
      });

      const result = await getDiscogsIdentity('token', 'secret');

      expect(result.username).toBe('testuser');
      expect(result.id).toBe(12345);
    });

    it('should throw DiscogsAuthError on 401', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ message: 'Invalid credentials' }),
      });

      await expect(getDiscogsIdentity('bad_token', 'bad_secret')).rejects.toThrow(DiscogsAuthError);
    });
  });

  describe('fetchDiscogsPage', () => {
    it('should fetch collection page successfully', async () => {
      const mockData = createMockCollectionResponse(1, 3, 50);

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      const result = await fetchDiscogsPage('testuser', 'token', 'secret', 1, 'added', 'desc', 50);

      expect(result.releases).toHaveLength(50);
      expect(result.pagination.pages).toBe(3);
      expect(result.pagination.page).toBe(1);
    });

    it('should include correct query parameters', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(createMockCollectionResponse()),
      });

      await fetchDiscogsPage('testuser', 'token', 'secret', 2, 'artist', 'asc', 100);

      const calledUrl = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(calledUrl).toContain('page=2');
      expect(calledUrl).toContain('per_page=100');
      expect(calledUrl).toContain('sort=artist');
      expect(calledUrl).toContain('sort_order=asc');
    });

    it('should throw DiscogsAuthError on 401', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ message: 'Invalid token' }),
      });

      await expect(
        fetchDiscogsPage('user', 'bad_token', 'secret', 1)
      ).rejects.toThrow(DiscogsAuthError);
    });

    it('should throw DiscogsRateLimitError on 429 after retries', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 429,
        json: () => Promise.resolve({ message: 'Rate limit exceeded' }),
      });

      await expect(
        fetchDiscogsPage('user', 'token', 'secret', 1)
      ).rejects.toThrow(DiscogsRateLimitError);

      // Should have retried 3 times
      expect(global.fetch).toHaveBeenCalledTimes(3);
    }, 15000); // Increased timeout for retries

    it('should retry on 500 errors', async () => {
      let callCount = 0;
      global.fetch = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          return Promise.resolve({
            ok: false,
            status: 500,
            json: () => Promise.resolve({ message: 'Server error' }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(createMockCollectionResponse()),
        });
      });

      const result = await fetchDiscogsPage('user', 'token', 'secret', 1);

      expect(result.releases).toBeDefined();
      expect(callCount).toBe(3);
    }, 15000);

    it('should include OAuth signature in request', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(createMockCollectionResponse()),
      });

      await fetchDiscogsPage('testuser', 'token', 'secret', 1);

      const calledUrl = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(calledUrl).toContain('oauth_consumer_key=');
      expect(calledUrl).toContain('oauth_signature=');
      expect(calledUrl).toContain('oauth_token=');
      expect(calledUrl).toContain('oauth_nonce=');
      expect(calledUrl).toContain('oauth_timestamp=');
    });
  });

  describe('OAuth signature generation', () => {
    it('should generate unique nonce for each request', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(createMockCollectionResponse()),
      });

      await fetchDiscogsPage('user', 'token', 'secret', 1);
      await fetchDiscogsPage('user', 'token', 'secret', 1);

      const url1 = (global.fetch as jest.Mock).mock.calls[0][0];
      const url2 = (global.fetch as jest.Mock).mock.calls[1][0];

      const nonce1 = new URLSearchParams(url1.split('?')[1]).get('oauth_nonce');
      const nonce2 = new URLSearchParams(url2.split('?')[1]).get('oauth_nonce');

      expect(nonce1).not.toBe(nonce2);
    });

    it('should use HMAC-SHA1 signature method', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(createMockCollectionResponse()),
      });

      await fetchDiscogsPage('user', 'token', 'secret', 1);

      const calledUrl = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(calledUrl).toContain('oauth_signature_method=HMAC-SHA1');
    });
  });

  describe('Error handling', () => {
    it('should handle network errors', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      await expect(
        fetchDiscogsPage('user', 'token', 'secret', 1)
      ).rejects.toThrow('Network error');
    });

    it('should handle JSON parse errors', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.reject(new Error('Invalid JSON')),
      });

      await expect(
        fetchDiscogsPage('user', 'token', 'secret', 1)
      ).rejects.toThrow();
    });
  });
});
