

import type { DiscogsRelease, Settings, AppleSearchStrategy, CombinedMetadata } from '../../types';
import { AppleSearchStrategyType } from '../../types';
import { normalizeSearchTerm, generateMetadataSearchArtistQueries, formatArtistNames } from '../../utils/formattingUtils';
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

    // Anchor on the field we already trust from Discogs; update the other from Apple.
    // - Correcting artist → search by album, take Apple's artist
    // - Correcting album  → search by artist, take Apple's album
    if (isCorrectingArtist && !isCorrectingAlbum) {
        strategies.push({ query: cleanedTitle, type: AppleSearchStrategyType.ALBUM_PLUS_YEAR, attribute: 'albumTerm', entity: 'album' });
        strategies.push({ query: cleanedTitle, type: AppleSearchStrategyType.ALBUM_PLUS_YEAR, omitEntity: true });

        // Fallback: artist-term searches (ANVs help when the Discogs title is noisy).
        const searchQueries = generateMetadataSearchArtistQueries(info.artists);
        searchQueries.forEach(query => {
            const cleaned = cleanForSearch(query);
            strategies.push({ query: cleaned, type: AppleSearchStrategyType.ARTIST_PLUS_YEAR, attribute: 'artistTerm', entity: 'album' });
            strategies.push({ query: cleaned, type: AppleSearchStrategyType.ARTIST_PLUS_YEAR, omitEntity: true });
        });
        info.artists.filter(a => !!a.anv).forEach(artist => {
            const cleanedAnv = cleanForSearch(artist.anv!);
            strategies.push({ query: cleanedAnv, type: AppleSearchStrategyType.ARTIST_PLUS_YEAR, attribute: 'artistTerm', entity: 'album' });
            strategies.push({ query: cleanedAnv, type: AppleSearchStrategyType.ARTIST_PLUS_YEAR, omitEntity: true });
        });

        return strategies;
    }

    if (isCorrectingAlbum) {
        const seenQueries = new Set<string>();

        const addArtistStrategies = (query: string) => {
            const cleaned = cleanForSearch(query);
            if (seenQueries.has(cleaned)) return;
            seenQueries.add(cleaned);
            strategies.push({ query: cleaned, type: AppleSearchStrategyType.ARTIST_PLUS_YEAR, attribute: 'artistTerm', entity: 'album' });
            strategies.push({ query: cleaned, type: AppleSearchStrategyType.ARTIST_PLUS_YEAR, omitEntity: true });
        };

        const searchQueries = generateMetadataSearchArtistQueries(info.artists);
        searchQueries.forEach(query => addArtistStrategies(query));

        // For collabs, Apple Music may attribute the album to only one primary artist.
        if (info.artists && info.artists.length > 1) {
            info.artists.forEach(artist => {
                addArtistStrategies(formatArtistNames([artist]));
            });
        }

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

    // When correcting both, or as album-correction fallback: search by album title.
    strategies.push({ query: cleanedTitle, type: AppleSearchStrategyType.ALBUM_PLUS_YEAR, attribute: 'albumTerm', entity: 'album' });
    strategies.push({ query: cleanedTitle, type: AppleSearchStrategyType.ALBUM_PLUS_YEAR, omitEntity: true });

    // When correcting artist alongside album, also try artist-term queries.
    if (isCorrectingArtist && isCorrectingAlbum) {
        const searchQueries = generateMetadataSearchArtistQueries(info.artists);
        searchQueries.forEach(query => {
            const cleaned = cleanForSearch(query);
            strategies.push({ query: cleaned, type: AppleSearchStrategyType.ARTIST_PLUS_YEAR, attribute: 'artistTerm', entity: 'album' });
            strategies.push({ query: cleaned, type: AppleSearchStrategyType.ARTIST_PLUS_YEAR, omitEntity: true });
        });
    }

    return strategies;
}