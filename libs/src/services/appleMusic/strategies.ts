
import type { DiscogsRelease, Settings, AppleSearchStrategy, CombinedMetadata } from '../../types';
import { AppleSearchStrategyType } from '../../types';
import { generateMetadataSearchArtistQueries } from '../../utils/formattingUtils';
import { cleanForSearch } from '../../utils/fuzzyUtils';

/**
 * Keep strategies few: Apple Search API allows ~20 calls/min.
 * Prefer one strong album-anchored query when correcting artist.
 */
export function generateSearchStrategies(release: DiscogsRelease, settings: Settings, metadata?: CombinedMetadata): AppleSearchStrategy[] {
    const info = release.basic_information;
    const strategies: AppleSearchStrategy[] = [];

    const artistDisplayName = info.artist_display_name;
    const title = info.title;

    if (!artistDisplayName || !title) {
        return [];
    }
    
    // --- SPECIAL CASE: Artist-only lookup for collaboration fallback ---
    if (title === "Artist Correction Search") {
        const cleanedArtist = cleanForSearch(artistDisplayName);
        strategies.push({
            query: cleanedArtist,
            type: AppleSearchStrategyType.ARTIST_ONLY,
            entity: 'musicArtist',
        });
        return strategies;
    }
    
    const isCorrectingArtist = settings.artistSource === 'apple';
    const isCorrectingAlbum = settings.albumSource === 'apple';

    if (!isCorrectingArtist && !isCorrectingAlbum) {
        return [];
    }

    const cleanedTitle = cleanForSearch(title);

    // Correcting artist (album stays Discogs): one album-title search.
    if (isCorrectingArtist && !isCorrectingAlbum) {
        strategies.push({
            query: cleanedTitle,
            type: AppleSearchStrategyType.ALBUM_PLUS_YEAR,
            attribute: 'albumTerm',
            entity: 'album',
        });
        return strategies;
    }

    // Correcting album (and optionally artist): one artist-term search, then album-title fallback.
    const searchQueries = generateMetadataSearchArtistQueries(info.artists);
    const primaryArtistQuery = cleanForSearch(searchQueries[0] || artistDisplayName);
    strategies.push({
        query: primaryArtistQuery,
        type: AppleSearchStrategyType.ARTIST_PLUS_YEAR,
        attribute: 'artistTerm',
        entity: 'album',
    });
    strategies.push({
        query: cleanedTitle,
        type: AppleSearchStrategyType.ALBUM_PLUS_YEAR,
        attribute: 'albumTerm',
        entity: 'album',
    });

    return strategies;
}
