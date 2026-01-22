import CryptoJS from 'crypto-js';

/**
 * Crypto adapter
 * Uses crypto-js for all hashing operations (works on both web and mobile)
 */

/**
 * Generate HMAC-SHA1 signature (used for Discogs OAuth 1.0a)
 * Note: expo-crypto doesn't support HMAC, so we use crypto-js
 *
 * @param message - The message to sign
 * @param key - The signing key
 * @returns Base64-encoded signature
 */
export function hmacSha1Base64(message: string, key: string): string {
  const signature = CryptoJS.HmacSHA1(message, key);
  return CryptoJS.enc.Base64.stringify(signature);
}

/**
 * Generate MD5 hash (used for Last.fm API signatures)
 * Uses crypto-js which works on both web and mobile
 * @param message - The message to hash
 * @returns Hex-encoded hash
 */
export async function md5(message: string): Promise<string> {
  const hash = CryptoJS.MD5(message);
  return hash.toString(CryptoJS.enc.Hex);
}

/**
 * RFC 3986 URL encoding (for OAuth)
 */
export function rfc3986encode(str: string): string {
  return encodeURIComponent(str)
    .replace(/!/g, '%21')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
    .replace(/\*/g, '%2A');
}
