
import type { DiscogsArtist, CombinedMetadata, Settings } from '../types';
import { MetadataSourceType } from '../types';
import { calculateFuzzyScore } from './fuzzyUtils';
import { getSourceMetadata } from './metadataUtils';


/**
 * Clean the artist name by removing the Discogs numeric suffix (e.g., "Artist (2)")
 * and handling the ", The" suffix (e.g., "Alchemist, The" -> "The Alchemist").
 */
export const getDisplayArtistName = (name: string): string => {
  if (!name) return '';
  // Remove Discogs numeric suffix like " (2)"
  let cleaned = name.replace(/\s\(\d+\)$/, '').trim();
  
  // Handle "Name, The" -> "The Name"
  // Case-insensitive check for ", The" at the end of the string
  if (cleaned.toLowerCase().endsWith(', the')) {
      const base = cleaned.substring(0, cleaned.length - 5).trim();
      return `The ${base}`;
  }
  
  return cleaned;
};

/**
 * Helper to determine the string used to join two artists based on the 'join' property.
 */
export const getArtistJoiner = (join?: string): string => {
  // If join is missing or empty, Discogs has not specified a joiner — default to comma-space.
  // (Track-level artists in particular always arrive with join: "" rather than a real value.)
  if (!join) {
      return ', ';
  }

  const trimmed = join.trim();
  
  // Whitespace-only join — normalize to a single space
  if (trimmed.length === 0) {
      return ' ';
  }
  
  // If it's a comma, standard formatting is comma+space
  if (trimmed === ',') {
      return ', ';
  }
  
  // For other joiners (Ampersand, 'feat', 'vs'), wrap with spaces.
  // e.g. " & " -> " & "
  return ` ${trimmed} `;
};

/** Discogs often sends "," as a placeholder; treat it as unspecified so source joiners can win. */
const isUnspecifiedJoin = (join?: string): boolean => {
    if (!join) return true;
    const trimmed = join.trim();
    return trimmed.length === 0 || trimmed === ',';
};

/** Lowercase alphanumeric-only form for matching names that differ only in casing/punctuation. */
const normalizeAlphanumeric = (s: string): string =>
    s.toLowerCase().replace(/[^a-z0-9]/g, '');

/** Split a metadata artist string into individual artist chunks. */
export const splitSourceArtistChunks = (sourceString: string): string[] =>
    sourceString
        .split(/\s*(?:,|&|\bfeat\.|\bvs\.|\band\b)\s*/i)
        .map(s => s.trim())
        .filter(s => s.length > 0);

/** Prefer ANV over standard name when building search/display strings. */
export function getArtistSearchName(artist: { name: string; anv?: string }): string {
    return getDisplayArtistName(artist.anv || artist.name);
}

/**
 * Merge consecutive single-word artists that Discogs split (e.g. "Earl" + "Sweatshirt").
 * Stops at artists with an ANV or multi-word names so "MIKE" stays distinct.
 */
export function mergeAdjacentSingleWordArtists<T extends { name: string; anv?: string; join?: string }>(
    artists: T[]
): T[] {
    if (artists.length <= 1) return artists;

    const result: T[] = [];
    let i = 0;

    while (i < artists.length) {
        const curr = artists[i];
        const currName = getArtistSearchName(curr);
        const next = artists[i + 1];

        if (
            next
            && !curr.anv
            && !next.anv
            && !currName.includes(' ')
            && !getArtistSearchName(next).includes(' ')
            && isUnspecifiedJoin(curr.join)
        ) {
            const mergedName = `${currName} ${getArtistSearchName(next)}`;
            result.push({ ...curr, name: mergedName, anv: undefined, join: next.join });
            i += 2;
            continue;
        }

        result.push(curr);
        i += 1;
    }

    return result;
}

/** Use & between artists when Discogs left the join unspecified (comma placeholder). */
function applyCollabAmpersandBeforeLast<T extends { name: string; anv?: string; join?: string }>(
    artists: T[]
): T[] {
    if (artists.length < 2) return artists;
    return artists.map((artist, i) =>
        i === artists.length - 2 && isUnspecifiedJoin(artist.join)
            ? { ...artist, join: '&' }
            : artist
    );
}

/** Prepare artist array for metadata search: merge split names, apply collab joiners, keep ANVs. */
export function prepareArtistsForMetadataSearch<T extends { name: string; anv?: string; join?: string }>(
    artists: T[]
): T[] {
    if (!artists?.length) return [];
    return applyCollabAmpersandBeforeLast(mergeAdjacentSingleWordArtists(artists));
}

/** Combined artist string for metadata search, using ANVs and collab formatting heuristics. */
export function formatArtistsForMetadataSearch(
    artists: { name: string; anv?: string; join?: string }[]
): string {
    return formatArtistNames(prepareArtistsForMetadataSearch(artists));
}

/** Distinct artist query strings to try when fetching external metadata. */
export function generateMetadataSearchArtistQueries(
    artists: { name: string; anv?: string; join?: string }[]
): string[] {
    if (!artists?.length) return [];

    const queries = [
        formatArtistsForMetadataSearch(artists),
        formatArtistNames(artists),
    ];

    return [...new Set(queries.filter(q => q.length > 0))];
}

/**
 * When Discogs splits one artist into multiple entries (e.g. "Earl" + "Sweatshirt"),
 * merge consecutive entries to match the source chunks (e.g. "Earl Sweatshirt").
 */
export function mergeArtistsToMatchSource<T extends { name: string; anv?: string; join?: string }>(
    artists: T[],
    sourceString: string
): T[] | null {
    const chunks = splitSourceArtistChunks(sourceString);
    if (chunks.length >= artists.length) return null;

    const result: T[] = [];
    let artistIdx = 0;

    for (const chunk of chunks) {
        const chunkNorm = normalizeAlphanumeric(chunk);
        const group: T[] = [];
        let combinedNorm = '';

        while (artistIdx < artists.length) {
            const artist = artists[artistIdx];
            const partNorm = normalizeAlphanumeric(getDisplayArtistName(artist.name));
            const nextNorm = combinedNorm + partNorm;

            if (group.length === 0 && nextNorm !== chunkNorm && !chunkNorm.startsWith(nextNorm)) {
                if (calculateFuzzyScore(artist.name, chunk) < 0.85) return null;
                group.push(artist);
                artistIdx++;
                break;
            }

            group.push(artist);
            combinedNorm = nextNorm;
            artistIdx++;

            if (combinedNorm === chunkNorm) break;
            if (!chunkNorm.startsWith(combinedNorm)) return null;
        }

        if (group.length === 0) return null;

        result.push({
            ...group[0],
            name: group.length === 1 ? group[0].name : chunk,
        });
    }

    return artistIdx === artists.length ? result : null;
}

/**
 * Infers the join characters between artists from an external source string when Discogs
 * leaves the join field blank. Sequentially searches for each artist name in the source and
 * extracts whatever text sits between consecutive names as the joiner.
 * Falls back to the original artists untouched if any artist name cannot be located.
 */
// Returns null when any artist name cannot be found sequentially in the source.
export function inferJoinersFromSource<T extends { name: string; anv?: string; join?: string }>(
    artists: T[],
    sourceString: string
): T[] | null {
    if (artists.length <= 1 || !sourceString) return null;

    const sourceLower = sourceString.toLowerCase();
    let searchFrom = 0;
    const positions: { start: number; end: number }[] = [];

    for (const artist of artists) {
        const name = getDisplayArtistName(artist.anv || artist.name).toLowerCase();
        const pos = sourceLower.indexOf(name, searchFrom);
        if (pos === -1) return null;
        positions.push({ start: pos, end: pos + name.length });
        searchFrom = pos + name.length;
    }

    return artists.map((artist, i) => {
        if (i >= positions.length - 1) return artist;
        if (!isUnspecifiedJoin(artist.join)) return artist;
        const rawJoiner = sourceString.substring(positions[i].end, positions[i + 1].start);
        const joiner = rawJoiner.trim();
        return joiner ? { ...artist, join: joiner } : artist;
    });
}

/** Validate names, merge split artists, and infer joiners from external metadata. */
export function alignArtistsWithSource(
    artists: DiscogsArtist[],
    sourceString: string
): DiscogsArtist[] {
    const validated = artists.map(artist => ({
        ...artist,
        name: validateArtistName(artist, sourceString),
        anv: undefined as string | undefined,
    }));
    const merged = mergeArtistsToMatchSource(validated, sourceString) ?? validated;
    return inferJoinersFromSource(merged, sourceString) ?? merged;
}


export function getTrackArtistDisplay(
    trackArtists: DiscogsArtist[],
    metadata: CombinedMetadata | undefined,
    settings: Settings
): string {
    if (!trackArtists?.length) return '';
    const sourceMeta = getSourceMetadata(metadata, settings.artistSource);
    const sourceString = sourceMeta?.artist || '';

    if (settings.artistSource === MetadataSourceType.Discogs || !sourceString) {
        return formatArtistNames(trackArtists);
    }

    const aligned = alignArtistsWithSource(trackArtists, sourceString);
    return formatArtistNames(aligned);
}

/**
 * Formats a list of artists into a single string using the 'join' attribute provided by Discogs.
 * Respects Artist Name Variation (anv) if present.
 */
export const formatArtistNames = (artists: { name: string; join?: string; anv?: string }[]): string => {
    if (!artists || artists.length === 0) return '';
    
    return artists.reduce((acc, artist, index) => {
        // Use ANV if available, otherwise fallback to primary name
        const nameToUse = artist.anv || artist.name;
        const displayName = getDisplayArtistName(nameToUse);
        
        if (index === 0) {
            return displayName;
        }
        
        // Use the joiner from the PREVIOUS artist to connect to the CURRENT artist.
        const prev = artists[index - 1];
        const joiner = getArtistJoiner(prev.join);
        
        return acc + joiner + displayName;
    }, '');
};

/**
 * Validates which name (ANV or Standard) best matches the authoritative source string.
 * Returns the name that should be displayed.
 * 
 * Logic:
 * 1. If source is missing, use Discogs default (ANV if exists, else Standard).
 * 2. If ANV exists and matches source well (threshold met) -> Use ANV. (Validation Success)
 * 3. If ANV fails but Standard matches source well -> Use Standard. (Correction)
 * 4. Fallback -> Use ANV if exists, else Standard.
 */
export function validateArtistName(artist: DiscogsArtist, sourceString: string): string {
    const standard = getDisplayArtistName(artist.name);
    const anv = artist.anv ? getDisplayArtistName(artist.anv) : null;
    
    // If no source string, default to ANV or Standard (Discogs behavior)
    if (!sourceString) return anv || standard;

    const chunks = splitSourceArtistChunks(sourceString);

    // Helper to find best score against any chunk
    const getBestScore = (target: string) => {
        if (!target) return 0;
        let maxScore = Math.max(0, calculateFuzzyScore(target, sourceString));
        for (const chunk of chunks) {
            maxScore = Math.max(maxScore, calculateFuzzyScore(target, chunk));
        }
        return maxScore;
    };

    const THRESHOLD = 0.85; // High confidence required

    // Case 1: Discogs has an ANV — use it when source confirms it (e.g. ANV "MIKE" or "mike.").
    // Never adopt alternate casing from the metadata source; only Discogs ANV/standard names apply.
    if (anv) {
        const anvScore = getBestScore(anv);

        if (anvScore >= THRESHOLD) {
            return anv;
        }

        const standardScore = getBestScore(standard);
        if (standardScore >= THRESHOLD) {
            return standard;
        }

        return anv;
    }

    return standard;
}

/**
 * Constructs a display string for the artist, intelligently merging Discogs data with External Metadata.
 */
export function getSmartArtistDisplay(
    artists: DiscogsArtist[], 
    metadata: CombinedMetadata | undefined,
    settings: Settings
): string {
    const sourceMeta = getSourceMetadata(metadata, settings.artistSource);
    const sourceString = sourceMeta?.artist || '';

    // If we are using Discogs source, or no metadata available, standard behavior
    if (settings.artistSource === MetadataSourceType.Discogs || !sourceString) {
        return formatArtistNames(artists);
    }

    const aligned = alignArtistsWithSource(artists, sourceString);
    return formatArtistNames(aligned);
}

/**
 * Creates a "simple" version of a search term by lowercasing,
 * removing accents (diacritics), and stripping most non-alphanumeric characters.
 * This is useful for creating fallback search queries.
 * e.g., "Sólstafir" -> "solstafir"
 */
export const normalizeSearchTerm = (str: string): string => {
    if (!str) return '';
    return str
        .toLowerCase()
        // Decompose accented characters into base character + combining mark
        .normalize('NFD') 
        // Remove combining diacritical marks
        .replace(/[\u0300-\u036f]/g, '')
        // Remove most non-alphanumeric characters, but keep spaces and hyphens
        .replace(/[^\w\s-]/g, '')
        // Collapse multiple whitespace characters into a single space
        .replace(/\s+/g, ' ')
        .trim();
};
