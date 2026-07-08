
import type { CombinedMetadata, MetadataSource, ServiceMetadata, Settings } from '../types';

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

/**
 * Artist string from whichever external metadata source is configured.
 * Prefers artistSource, then falls back to albumSource so joiners (e.g. "&")
 * apply even when only album metadata is enabled.
 */
export function getMetadataArtistString(
    metadata: CombinedMetadata | undefined,
    settings: Settings
): string {
    if (!metadata) return '';

    const sources = [settings.artistSource, settings.albumSource];
    for (const source of sources) {
        if (source === 'discogs') continue;
        const artist = metadata[source as keyof CombinedMetadata]?.artist;
        if (artist) return artist;
    }
    return '';
}
