
import type { DiscogsRelease, ServiceMetadata } from '../../types';
import { fetchFromDeezer } from './deezerAPI';
import { calculateFuzzyScore, cleanForSearch } from '../../utils/fuzzyUtils';

const ACCEPTANCE_THRESHOLD = 0.8;

export const fetchDeezerMetadata = async (
    release: DiscogsRelease,
    signal?: AbortSignal
): Promise<ServiceMetadata | null> => {
    if (!release.basic_information) return null;

    const artist = cleanForSearch(release.basic_information.artist_display_name);
    const title = cleanForSearch(release.basic_information.title);

    let searchResults;
    try {
        // Search with artist + album title combined
        searchResults = await fetchFromDeezer(`artist:"${artist}" album:"${title}"`, signal);
    } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') throw e;
        console.warn('[Deezer] Search failed', e);
        return null;
    }

    if (!searchResults.data || searchResults.data.length === 0) {
        // Fallback: broader search without field qualifiers
        try {
            searchResults = await fetchFromDeezer(`${artist} ${title}`, signal);
        } catch (e) {
            if (e instanceof DOMException && e.name === 'AbortError') throw e;
            console.warn('[Deezer] Fallback search failed', e);
            return null;
        }
    }

    if (!searchResults.data || searchResults.data.length === 0) return null;

    // Find best match
    let bestMatch = null;
    let bestScore = 0;

    for (const result of searchResults.data) {
        const titleScore = calculateFuzzyScore(
            release.basic_information.title,
            result.title
        );
        const artistScore = calculateFuzzyScore(
            release.basic_information.artist_display_name,
            result.artist.name
        );
        const score = (titleScore * 0.6) + (artistScore * 0.4);

        if (score > bestScore) {
            bestScore = score;
            bestMatch = result;
        }
    }

    if (!bestMatch || bestScore < ACCEPTANCE_THRESHOLD) {
        console.log(`[Deezer] No acceptable match for "${release.basic_information.artist_display_name} - ${release.basic_information.title}". Best: ${(bestScore * 100).toFixed(1)}%`);
        return null;
    }

    return {
        artist: bestMatch.artist.name,
        album: bestMatch.title,
        lastChecked: Date.now(),
        score: bestScore,
        rawResult: bestMatch,
    };
};
