

import type { DiscogsRelease, Settings, AppleSearchStrategy, CombinedMetadata } from '../../types';
import { AppleSearchStrategyType } from '../../types';
import { normalizeSearchTerm, formatArtistNames } from '../../utils/formattingUtils';
import { cleanForSearch } from '../../utils/fuzzyUtils';

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
        const normalizedArtist = normalizeSearchTerm(artistDisplayName);
        
        strategies.push({
            query: cleanedArtist,
            type: AppleSearchStrategyType.ARTIST_ONLY,
            entity: 'musicArtist',
        });
        if (normalizedArtist !== cleanedArtist) {
            strategies.push({
                query: normalizedArtist,
                type: AppleSearchStrategyType.ARTIST_ONLY,
                entity: 'musicArtist',
            });
        }
        return strategies;
    }
    
    // FIX: Check the actual source settings, not temporary flags.
    const isCorrectingArtist = settings.artistSource === 'apple';
    const isCorrectingAlbum = settings.albumSource === 'apple';

    if (!isCorrectingArtist && !isCorrectingAlbum) {
        return [];
    }

    const cleanedTitle = cleanForSearch(title);

    // When correcting the ARTIST:
    // We only generate strategies IF there is an ANV (Artist Name Variation) to validate.
    // As per requirement: "Apple only needs to be consulted if discogs provides 'anv'"
    if (isCorrectingArtist) {
        // Search by artist name — Apple search is approximate, and for artist correction
        // we want to find what Apple calls this artist, not locate the exact album.
        const searchArtistName = formatArtistNames(info.artists) || artistDisplayName;
        const cleanedArtist = cleanForSearch(searchArtistName);
        strategies.push({ query: cleanedArtist, type: AppleSearchStrategyType.ARTIST_PLUS_YEAR, attribute: 'artistTerm', entity: 'album' });
        strategies.push({ query: cleanedArtist, type: AppleSearchStrategyType.ARTIST_PLUS_YEAR, omitEntity: true });

        // When ANV exists, also search by the ANV directly
        info.artists.filter(a => !!a.anv).forEach(artist => {
            const cleanedAnv = cleanForSearch(artist.anv!);
            strategies.push({ query: cleanedAnv, type: AppleSearchStrategyType.ARTIST_PLUS_YEAR, attribute: 'artistTerm', entity: 'album' });
            strategies.push({ query: cleanedAnv, type: AppleSearchStrategyType.ARTIST_PLUS_YEAR, omitEntity: true });
        });
    }

    // When correcting the ALBUM, search using the artist name as the anchor.
    // For multi-artist releases, try all permutations of the artist array — Apple Music may
    // order collaborating artists differently. Deduplicate by query string so the same
    // search is never sent twice.
    if (isCorrectingAlbum) {
        const seenQueries = new Set<string>();

        const addArtistStrategies = (query: string) => {
            const cleaned = cleanForSearch(query);
            if (seenQueries.has(cleaned)) return;
            seenQueries.add(cleaned);
            strategies.push({ query: cleaned, type: AppleSearchStrategyType.ARTIST_PLUS_YEAR, attribute: 'artistTerm', entity: 'album' });
            strategies.push({ query: cleaned, type: AppleSearchStrategyType.ARTIST_PLUS_YEAR, omitEntity: true });
        };

        // Use formatArtistNames directly to ensure ANVs are interpolated into the search query.
        const searchArtistName = formatArtistNames(info.artists) || artistDisplayName;
        addArtistStrategies(searchArtistName);

        // For collabs, Apple Music may attribute the album to only one primary artist.
        // Always add individual artist searches so we can find the album regardless.
        if (info.artists && info.artists.length > 1) {
            info.artists.forEach(artist => {
                addArtistStrategies(formatArtistNames([artist]));
            });
        }

        // Also search by unique track-level artist combinations from cached metadata.
        const hasCachedThirdParty = !!(metadata?.apple || metadata?.musicbrainz || metadata?.deezer);
        if (hasCachedThirdParty) {
            const trackArtistStrings = new Set<string>();
            release.tracklist?.forEach(track => {
                if (track.artists && track.artists.length > 1) trackArtistStrings.add(formatArtistNames(track.artists));
                track.sub_tracks?.forEach(sub => { if (sub.artists && sub.artists.length > 1) trackArtistStrings.add(formatArtistNames(sub.artists)); });
            });
            for (const combo of trackArtistStrings) {
                addArtistStrategies(combo);
            }
        }
    }

    // Final fallback: search by album title if all artist-anchored searches fail.
    strategies.push({ query: cleanedTitle, type: AppleSearchStrategyType.ALBUM_PLUS_YEAR, attribute: 'albumTerm', entity: 'album' });
    strategies.push({ query: cleanedTitle, type: AppleSearchStrategyType.ALBUM_PLUS_YEAR, omitEntity: true });

    return strategies;
}