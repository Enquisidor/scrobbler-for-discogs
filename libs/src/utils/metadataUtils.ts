
import type { CombinedMetadata, MetadataSource, ServiceMetadata } from '../types';

/**
 * Look up the ServiceMetadata for a given source from CombinedMetadata.
 * Returns undefined for 'discogs' source or if metadata is missing.
 */
export function getSourceMetadata(
    metadata: CombinedMetadata | undefined,
    source: MetadataSource
): ServiceMetadata | undefined {
    if (!metadata || source === 'discogs') return undefined;
    return metadata[source as keyof CombinedMetadata];
}
