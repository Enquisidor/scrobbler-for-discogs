/**
 * Tests for lastfmService
 *
 * Priority 1 - Critical: Auth flow, MD5 signatures, scrobbling API
 *
 * Note: Tests mock fetch - no actual API calls are made
 */
import { getLastfmSession, scrobbleTracks } from '../lastfmService';
import * as cryptoAdapter from '../../adapters/cryptoAdapter';

// Mock the crypto adapter
jest.mock('../../adapters/cryptoAdapter', () => ({
  md5: jest.fn(),
}));

const mockMd5 = cryptoAdapter.md5 as jest.Mock;

// Store original fetch
const originalFetch = global.fetch;

describe('lastfmService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default md5 mock - returns predictable hash based on input length
    mockMd5.mockImplementation((input: string) =>
      Promise.resolve('a'.repeat(32))
    );
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('getLastfmSession', () => {
    it('should return session data on successful auth', async () => {
      const mockSession = {
        session: {
          name: 'testuser',
          key: 'session_key_123',
          subscriber: 0,
        },
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockSession),
      });

      const result = await getLastfmSession('api_key', 'secret', 'auth_token');

      expect(result.name).toBe('testuser');
      expect(result.key).toBe('session_key_123');
    });

    it('should call md5 with correct signature string', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ session: { name: 'user', key: 'key' } }),
      });

      await getLastfmSession('test_api_key', 'test_secret', 'test_token');

      expect(mockMd5).toHaveBeenCalled();
      const sigString = mockMd5.mock.calls[0][0];
      // Signature string should contain sorted params + secret
      expect(sigString).toContain('api_key');
      expect(sigString).toContain('test_api_key');
      expect(sigString).toContain('method');
      expect(sigString).toContain('auth.getsession');
      expect(sigString).toContain('token');
      expect(sigString).toContain('test_token');
      expect(sigString).toContain('test_secret');
    });

    it('should throw error on API error response', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          error: 4,
          message: 'Invalid authentication token',
        }),
      });

      await expect(
        getLastfmSession('api_key', 'secret', 'bad_token')
      ).rejects.toThrow('Invalid authentication token');
    });

    it('should include api_sig in request', async () => {
      mockMd5.mockResolvedValue('computed_signature_hash');

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ session: { name: 'user', key: 'key' } }),
      });

      await getLastfmSession('api_key', 'secret', 'token');

      const calledUrl = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(calledUrl).toContain('api_sig=computed_signature_hash');
    });
  });

  describe('scrobbleTracks', () => {
    const mockTracks = [
      { artist: 'Artist 1', track: 'Track 1', album: 'Album 1', timestamp: 1700000000 },
      { artist: 'Artist 2', track: 'Track 2', album: 'Album 2', timestamp: 1700000200 },
      { artist: 'Artist 3', track: 'Track 3', timestamp: 1700000400 }, // No album
    ];

    it('should scrobble tracks successfully', async () => {
      const mockResponse = {
        scrobbles: {
          '@attr': { accepted: 3, ignored: 0 },
          scrobble: mockTracks.map(t => ({
            artist: { '#text': t.artist },
            track: { '#text': t.track },
          })),
        },
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await scrobbleTracks(
        mockTracks,
        'session_key',
        'api_key',
        'secret'
      );

      expect(result).toBeDefined();
    });

    it('should include indexed track parameters', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ scrobbles: {} }),
      });

      await scrobbleTracks(mockTracks, 'session', 'api_key', 'secret');

      const calledUrl = (global.fetch as jest.Mock).mock.calls[0][0];

      // Check indexed parameters (spaces may be encoded as + or %20)
      expect(calledUrl).toContain('artist%5B0%5D=');
      expect(calledUrl).toMatch(/artist%5B0%5D=Artist[+%20]1/);
      expect(calledUrl).toMatch(/track%5B0%5D=Track[+%20]1/);
      expect(calledUrl).toMatch(/album%5B0%5D=Album[+%20]1/);
      expect(calledUrl).toContain('timestamp%5B0%5D=1700000000');

      expect(calledUrl).toMatch(/artist%5B1%5D=Artist[+%20]2/);
      expect(calledUrl).toMatch(/artist%5B2%5D=Artist[+%20]3/);
    });

    it('should not include album parameter when not provided', async () => {
      const tracksNoAlbum = [
        { artist: 'Artist', track: 'Track', timestamp: 1700000000 },
      ];

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ scrobbles: {} }),
      });

      await scrobbleTracks(tracksNoAlbum, 'session', 'api_key', 'secret');

      const calledUrl = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(calledUrl).not.toContain('album%5B0%5D');
    });

    it('should use POST method', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ scrobbles: {} }),
      });

      await scrobbleTracks(mockTracks, 'session', 'api_key', 'secret');

      const options = (global.fetch as jest.Mock).mock.calls[0][1];
      expect(options.method).toBe('POST');
    });

    it('should include session key in request', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ scrobbles: {} }),
      });

      await scrobbleTracks(mockTracks, 'my_session_key', 'api_key', 'secret');

      const calledUrl = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(calledUrl).toContain('sk=my_session_key');
    });

    it('should throw error on API error response', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          error: 9,
          message: 'Invalid session key',
        }),
      });

      await expect(
        scrobbleTracks(mockTracks, 'bad_session', 'api_key', 'secret')
      ).rejects.toThrow('Invalid session key');
    });

    it('should handle empty tracks array', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ scrobbles: {} }),
      });

      const result = await scrobbleTracks([], 'session', 'api_key', 'secret');

      expect(result).toBeDefined();
    });

    it('should generate correct signature excluding format param', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ scrobbles: {} }),
      });

      await scrobbleTracks(
        [{ artist: 'A', track: 'T', timestamp: 123 }],
        'session',
        'api_key',
        'secret'
      );

      // Check that md5 was called
      expect(mockMd5).toHaveBeenCalled();
      const sigString = mockMd5.mock.calls[0][0];

      // format and callback should NOT be in signature
      expect(sigString).not.toContain('format');
      expect(sigString).not.toContain('callback');

      // But other params should be there
      expect(sigString).toContain('api_key');
      expect(sigString).toContain('method');
      expect(sigString).toContain('track.scrobble');
    });
  });

  describe('API signature generation', () => {
    it('should sort parameters alphabetically', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ session: { name: 'u', key: 'k' } }),
      });

      await getLastfmSession('zz_api_key', 'secret', 'aa_token');

      const sigString = mockMd5.mock.calls[0][0];

      // api_key should come before method, method before token (alphabetical)
      const apiKeyPos = sigString.indexOf('api_key');
      const methodPos = sigString.indexOf('method');
      const tokenPos = sigString.indexOf('token');

      expect(apiKeyPos).toBeLessThan(methodPos);
      expect(methodPos).toBeLessThan(tokenPos);
    });

    it('should append secret at end of signature string', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ session: { name: 'u', key: 'k' } }),
      });

      await getLastfmSession('api_key', 'MY_SECRET', 'token');

      const sigString = mockMd5.mock.calls[0][0];
      expect(sigString.endsWith('MY_SECRET')).toBe(true);
    });
  });
});
