// This file assumes CryptoJS is loaded globally from a CDN in index.html
declare const CryptoJS: any;

import type { DiscogsArtist } from './types';

export const createLastfmSignature = (params: Record<string, string>, secret: string): string => {
  const sortedKeys = Object.keys(params).sort();
  let sigString = '';
  sortedKeys.forEach(key => {
    if (key !== 'format' && key !== 'callback') {
      sigString += key + params[key];
    }
  });
  sigString += secret;
  return CryptoJS.MD5(sigString).toString();
};
