
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
        if (artist.join) return artist;
        const rawJoiner = sourceString.substring(positions[i].end, positions[i + 1].start);
        const joiner = rawJoiner.trim();
        return joiner ? { ...artist, join: joiner } : artist;
    });
}

// Extracts the dominant separator from a metadata artist string (prefers & over ,).
function extractSourceJoiner(sourceString: string): string | null {
    if (sourceString.includes('&')) return '&';
    if (sourceString.includes(',')) return ',';
    return null;
}

/**
 * Formats track-level artists using the metadata source to fill in missing Discogs join chars.
 * Tries sequential position inference first; falls back to the dominant separator in the source.
 */
export function getTrackArtistDisplay(
    trackArtists: DiscogsArtist[],
    metadata: CombinedMetadata | undefined,
    settings: Settings
): string {
    if (!trackArtists?.length) return '';
    const sourceMeta = getSourceMetadata(metadata, settings.artistSource);
    const sourceString = sourceMeta?.artist || '';

    if (!sourceString) return formatArtistNames(trackArtists);

    const sequential = inferJoinersFromSource(trackArtists, sourceString);
    if (sequential) return formatArtistNames(sequential);

    // Artists not found sequentially (e.g. track subset doesn't match source order).
    // Apply the dominant separator from the source to all unspecified joins.
    const joiner = extractSourceJoiner(sourceString);
    if (!joiner) return formatArtistNames(trackArtists);
    const withJoiners = trackArtists.map((a, i) =>
        i < trackArtists.length - 1 && !a.join ? { ...a, join: joiner } : a
    );
    return formatArtistNames(withJoiners);
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

    // Split source into chunks to handle "Artist A & Artist B" scenarios
    // We match against chunks to see if our artist name appears in the source
    const chunks = sourceString.split(/\s*(?:,|&|\bfeat\.|\bvs\.|\band\b)\s*/i)
        .map(s => s.trim())
        .filter(s => s.length > 0);

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

    // Case 1: Discogs has an ANV
    if (anv) {
        const anvScore = getBestScore(anv);
        
        // If ANV matches the source well, we VALIDATE it and USE it.
        // We prioritize the ANV (the specific intent of the release) over the Standard name
        // as long as the source confirms it's not completely wrong.
        if (anvScore >= THRESHOLD) {
            return anv;
        }

        // ANV did not match source well (e.g. "AFX" vs "Aphex Twin").
        // Check if Standard name matches source.
        const standardScore = getBestScore(standard);
        if (standardScore >= THRESHOLD) {
            return standard; // Correction: Use Standard
        }

        // Neither matched the source well. 
        // We fallback to Discogs preference (ANV).
        return anv;
    }

    // Case 2: No ANV — use the source's form only when names differ purely in casing.
    // Fuzzy scoring alone can't distinguish 'mike.' from 'MIKE' (both tokenize to 'mike'),
    // so we require a case-insensitive exact match to avoid overwriting stylized names.
    const standardLower = standard.toLowerCase();
    for (const chunk of chunks) {
        if (chunk.toLowerCase() === standardLower && chunk !== standard) return chunk;
    }
    if (sourceString.toLowerCase() === standardLower && sourceString !== standard) return sourceString;
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

    // We have external metadata. Validate each artist name and infer missing joiners.
    const validatedArtists = artists.map(artist => {
        const bestName = validateArtistName(artist, sourceString);
        return { ...artist, name: bestName, anv: undefined };
    });
    const withJoiners = inferJoinersFromSource(validatedArtists, sourceString) ?? validatedArtists;

    const reconstructed = formatArtistNames(withJoiners);

    // Detect capitalization or artist order differences between Discogs and the source.
    // If the names match case-insensitively but differ in exact casing or order,
    // prefer the source string (e.g. "KAYTRANADA" vs "Kaytranada", or
    // "21 Savage & Drake" vs "Drake & 21 Savage").
    const score = calculateFuzzyScore(reconstructed, sourceString);
    const hasCaseDifference = reconstructed.toLowerCase() === sourceString.toLowerCase()
        && reconstructed !== sourceString;
    const hasOrderDifference = score >= 0.85
        && reconstructed.toLowerCase() !== sourceString.toLowerCase();

    if (hasCaseDifference || hasOrderDifference) {
        return sourceString;
    }

    return reconstructed;
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
