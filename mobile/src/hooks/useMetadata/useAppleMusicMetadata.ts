

import { useCallback } from 'react';
import { useStorage } from '../../../../libs/src/hooks/useStorage';
import type { ServiceMetadata } from '@libs';

export function useAppleMusicMetadata() {
    const [metadata, setMetadata] = useStorage<Record<number, ServiceMetadata>>('vinyl-scrobbler-metadata-v2', {});

    const updateMetadata = useCallback((id: number, data: ServiceMetadata) => {
        setMetadata(prev => ({ ...prev, [id]: data }));
    }, [setMetadata]);

    const clearMetadata = useCallback(() => {
        setMetadata({});
        localStorage.removeItem('vinyl-scrobbler-metadata-v2');
    }, [setMetadata]);

    return { metadata, updateMetadata, clearMetadata };
}