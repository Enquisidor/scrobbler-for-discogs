/**
 * Tests for cryptoAdapter
 *
 * Priority 1 - Critical: OAuth signatures must be correct or auth fails
 *
 * Covers:
 * - HMAC-SHA1 signature generation for Discogs OAuth 1.0a
 * - MD5 hash generation for Last.fm API signatures
 * - RFC 3986 URL encoding for OAuth
 */
import { hmacSha1Base64, md5, rfc3986encode } from '../cryptoAdapter';

describe('cryptoAdapter', () => {
  describe('hmacSha1Base64', () => {
    it('should generate correct HMAC-SHA1 signature for known input', () => {
      // Using known test vectors
      const message = 'The quick brown fox jumps over the lazy dog';
      const key = 'key';
      const result = hmacSha1Base64(message, key);

      // Expected value computed externally
      expect(result).toBe('3nybhbi3iqa8ino29wqQcBydtNk=');
    });

    it('should generate correct signature for OAuth base string', () => {
      // Simulated OAuth base string
      const baseString = 'GET&https%3A%2F%2Fapi.discogs.com%2Foauth%2Frequest_token&oauth_consumer_key%3Dtest_key';
      const signingKey = 'consumer_secret&token_secret';
      const result = hmacSha1Base64(baseString, signingKey);

      // Should return a base64 string
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
      // Base64 should only contain valid characters
      expect(result).toMatch(/^[A-Za-z0-9+/]+=*$/);
    });

    it('should handle empty message', () => {
      const result = hmacSha1Base64('', 'key');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle empty key', () => {
      const result = hmacSha1Base64('message', '');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should produce different signatures for different messages', () => {
      const key = 'secret';
      const sig1 = hmacSha1Base64('message1', key);
      const sig2 = hmacSha1Base64('message2', key);
      expect(sig1).not.toBe(sig2);
    });

    it('should produce different signatures for different keys', () => {
      const message = 'message';
      const sig1 = hmacSha1Base64(message, 'key1');
      const sig2 = hmacSha1Base64(message, 'key2');
      expect(sig1).not.toBe(sig2);
    });
  });

  describe('md5', () => {
    it('should generate correct MD5 hash for known input', async () => {
      // Known MD5 test vector
      const result = await md5('hello');
      expect(result).toBe('5d41402abc4b2a76b9719d911017c592');
    });

    it('should generate correct hash for empty string', async () => {
      const result = await md5('');
      expect(result).toBe('d41d8cd98f00b204e9800998ecf8427e');
    });

    it('should generate lowercase hex output', async () => {
      const result = await md5('test');
      expect(result).toMatch(/^[0-9a-f]{32}$/);
    });

    it('should generate correct hash for Last.fm signature string', async () => {
      // Simulated Last.fm API signature string
      const sigString = 'api_keyTEST_KEYmethodtrack.scrobbleSECRET';
      const result = await md5(sigString);

      // Should be 32 hex characters
      expect(result).toHaveLength(32);
      expect(result).toMatch(/^[0-9a-f]+$/);
    });

    it('should handle unicode characters', async () => {
      const result = await md5('héllo wörld');
      expect(result).toHaveLength(32);
      expect(result).toMatch(/^[0-9a-f]+$/);
    });
  });

  describe('rfc3986encode', () => {
    it('should encode basic special characters', () => {
      expect(rfc3986encode('hello world')).toBe('hello%20world');
      expect(rfc3986encode('test&value')).toBe('test%26value');
      expect(rfc3986encode('test=value')).toBe('test%3Dvalue');
    });

    it('should encode characters that encodeURIComponent leaves alone', () => {
      // RFC 3986 requires encoding these, but encodeURIComponent does not
      expect(rfc3986encode('!')).toBe('%21');
      expect(rfc3986encode("'")).toBe('%27');
      expect(rfc3986encode('(')).toBe('%28');
      expect(rfc3986encode(')')).toBe('%29');
      expect(rfc3986encode('*')).toBe('%2A');
    });

    it('should not encode unreserved characters', () => {
      // Unreserved characters should not be encoded
      const unreserved = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_.~';
      expect(rfc3986encode(unreserved)).toBe(unreserved);
    });

    it('should encode a full OAuth parameter string correctly', () => {
      const url = 'https://api.discogs.com/oauth/request_token';
      const encoded = rfc3986encode(url);
      expect(encoded).toBe('https%3A%2F%2Fapi.discogs.com%2Foauth%2Frequest_token');
    });

    it('should handle empty string', () => {
      expect(rfc3986encode('')).toBe('');
    });

    it('should handle complex OAuth callback URL', () => {
      const callback = 'scrobbler-for-discogs://auth/discogs?mode=callback';
      const encoded = rfc3986encode(callback);
      expect(encoded).toContain('%3A'); // :
      expect(encoded).toContain('%2F'); // /
      expect(encoded).toContain('%3F'); // ?
      expect(encoded).toContain('%3D'); // =
    });
  });
});
