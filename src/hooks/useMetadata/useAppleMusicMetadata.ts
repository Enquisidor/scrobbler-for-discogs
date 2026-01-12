

import { useCallback } from 'react';
import { useLocalStorage } from '../useLocalStorage';
// FIX: Changed AppleMusicMetadata to ServiceMetadata, as this hook is intended to store generic service metadata.
import type { ServiceMetadata } from '../../types';

export function useAppleMusicMetadata() {
  const [metadata, setMetadata] = useLocalStorage<Record<number, ServiceMetadata>>('vinyl-scrobbler-metadata-v2', {});

  const updateMetadata = useCallback((id: number, data: ServiceMetadata) => {
      setMetadata(prev => ({ ...prev, [id]: data }));
  }, [setMetadata]);

  const clearMetadata = useCallback(() => {
    setMetadata({});
    localStorage.removeItem('vinyl-scrobbler-metadata-v2');
  }, [setMetadata]);

  return { metadata, updateMetadata, clearMetadata };
}