
import type { DiscogsRelease, Settings, AppleSearchStrategy, CombinedMetadata } from '../../types';
import { AppleSearchStrategyType } from '../../types';
import {
    formatArtistNames,
    generateMetadataSearchArtistQueries,
    getDisplayArtistName,
    splitSourceArtistChunks,
} from '../../utils/formattingUtils';
import { albumTitleVariants, calculateCloseEnoughScore, cleanForSearch } from '../../utils/fuzzyUtils';

function shouldSearch(settings: Settings): boolean {
    return settings.artistSource === 'apple' || settings.albumSource === 'apple';
}

function addArtistAlbumSearch(
    strategies: AppleSearchStrategy[],
    seen: Set<string>,
    query: string
): void {
    const cleaned = cleanForSearch(query);
    if (!cleaned || seen.has(cleaned)) return;
    seen.add(cleaned);
    strategies.push({
        query: cleaned,
        type: AppleSearchStrategyType.ARTIST_PLUS_YEAR,
        attribute: 'artistTerm',
        entity: 'album',
    });
}

/**
 * Artist → album reverse search: query Apple by artist (combined credit and/or each
 * artist separately), then keep hits whose album title resembles Discogs.
 */
export function generateArtistSearchStrategies(
    release: DiscogsRelease,
    settings: Settings,
    extraArtistQueries: string[] = []
): AppleSearchStrategy[] {
    const info = release.basic_information;
    if (!info.artist_display_name || !info.title || !shouldSearch(settings)) return [];

    const strategies: AppleSearchStrategy[] = [];
    const seen = new Set<string>();

    for (const query of generateMetadataSearchArtistQueries(info.artists ?? [])) {
        addArtistAlbumSearch(strategies, seen, query);
    }
    addArtistAlbumSearch(strategies, seen, info.artist_display_name);
    for (const artist of info.artists ?? []) {
        addArtistAlbumSearch(strategies, seen, getDisplayArtistName(artist.anv || artist.name));
        if (artist.anv) addArtistAlbumSearch(strategies, seen, getDisplayArtistName(artist.name));
    }
    for (const query of extraArtistQueries) {
        addArtistAlbumSearch(strategies, seen, query);
    }

    return strategies;
}

/**
 * When nothing same/similar matched, take the closest harvested Apple name so far for
 * each Discogs collab member and retry the collab with only that one artist corrected
 * (Discogs joiners + Apple-style "&").
 */
export function buildOneArtistCorrectedCollabQueries(
    release: DiscogsRelease,
    correctedArtists: Iterable<string>,
    triedArtistQueries: Set<string>
): string[] {
    const artists = release.basic_information.artists ?? [];
    if (artists.length < 2) return [];

    // Flatten harvested names into per-artist candidates (split collab strings).
    const candidates: string[] = [];
    const seenCandidates = new Set<string>();
    for (const corrected of correctedArtists) {
        const chunks = splitSourceArtistChunks(corrected);
        for (const chunk of chunks.length > 0 ? chunks : [corrected]) {
            const cleaned = cleanForSearch(chunk);
            if (!cleaned || seenCandidates.has(cleaned)) continue;
            seenCandidates.add(cleaned);
            candidates.push(chunk);
        }
    }
    if (candidates.length === 0) return [];

    const queries: string[] = [];
    const seen = new Set<string>();

    const push = (query: string) => {
        const cleaned = cleanForSearch(query);
        if (!cleaned || seen.has(cleaned) || triedArtistQueries.has(cleaned)) return;
        seen.add(cleaned);
        queries.push(query);
    };

    // For each Discogs artist, substitute the closest candidate found so far (if different).
    for (let i = 0; i < artists.length; i++) {
        const discogsName = getDisplayArtistName(artists[i].anv || artists[i].name);
        let bestCandidate: string | null = null;
        let bestScore = -1;

        for (const candidate of candidates) {
            const score = calculateCloseEnoughScore(discogsName, candidate);
            if (score > bestScore) {
                bestScore = score;
                bestCandidate = candidate;
            }
        }

        if (!bestCandidate || bestScore <= 0) continue;
        if (cleanForSearch(discogsName) === cleanForSearch(bestCandidate)) continue;

        const substituted = artists.map((artist, idx) =>
            idx === i
                ? { ...artist, name: bestCandidate!, anv: undefined }
                : artist
        );

        push(formatArtistNames(substituted));
        push(
            substituted
                .map(a => getDisplayArtistName(a.anv || a.name))
                .join(' & ')
        );
    }

    return queries;
}

/**
 * Album-title fallback: used when artist search finds no close album titles.
 * A strong album hit also supplies Apple's corrected artistName.
 */
export function generateAlbumSearchStrategies(
    release: DiscogsRelease,
    settings: Settings
): AppleSearchStrategy[] {
    const info = release.basic_information;
    if (!info.artist_display_name || !info.title || !shouldSearch(settings)) return [];

    const strategies: AppleSearchStrategy[] = [];
    const seen = new Set<string>();
    for (const variant of albumTitleVariants(info.title)) {
        const cleaned = cleanForSearch(variant);
        if (!cleaned || seen.has(cleaned)) continue;
        seen.add(cleaned);
        strategies.push({
            query: cleaned,
            type: AppleSearchStrategyType.ALBUM_PLUS_YEAR,
            attribute: 'albumTerm',
            entity: 'album',
        });
    }
    return strategies;
}

/**
 * Reverse-engineer the Apple release:
 * 1. Search by artist (combined / separated) for albums resembling Discogs
 * 2. If none match, album-title search (may reveal a corrected artist name)
 * Extra corrected-artist retries are orchestrated in appleMusicService.
 */
export function generateSearchStrategies(
    release: DiscogsRelease,
    settings: Settings,
    _metadata?: CombinedMetadata
): AppleSearchStrategy[] {
    return [
        ...generateArtistSearchStrategies(release, settings),
        ...generateAlbumSearchStrategies(release, settings),
    ];
}
