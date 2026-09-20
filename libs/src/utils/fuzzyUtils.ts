export const getLevenshteinDistance = (a: string, b: string): number => {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const matrix: number[][] = [];

    // increment along the first column of each row
    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }

    // increment each column in the first row
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    // Fill in the rest of the matrix
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    Math.min(
                        matrix[i][j - 1] + 1, // insertion
                        matrix[i - 1][j] + 1 // deletion
                    )
                );
            }
        }
    }

    return matrix[b.length][a.length];
};

const STOP_WORDS = new Set(['the', 'a', 'an', 'and', '&', 'of', 'in', 'on', 'at']);

/** Trailing edition / version noise often present on Discogs but missing (or different) on Apple. */
const TRAILING_EDITION_PARENS = /\s*\([^)]*(?:edition|version|deluxe|expanded|remaster(?:ed)?|anniversary|bonus|explicit|clean|instrumental)[^)]*\)\s*$/i;
const TRAILING_EDITION_DASH = /\s+[-–—]\s+(?:deluxe|expanded|remaster(?:ed)?|anniversary|bonus)\b.*$/i;

// Tokenizer for SCORING: Strips ALL non-alphanumeric characters to match "Guns N' Roses" vs "Guns N Roses".
export const tokenize = (str: string): string[] => {
    if (!str) return [];
    const cleaned = str.toLowerCase()
        .replace(/\s\(\d+\)$/, '') // Remove Discogs suffix like " (2)"
        .trim();

    return cleaned.split(/\s+/)
        .map(t => t.replace(/[^a-z0-9]/g, '')) // Strip ALL non-alphanumeric characters from each token.
        .filter(t => t.length > 0 && !STOP_WORDS.has(t)); // Filter out stop words
};

// Cleaner for SEARCHING: Preserves punctuation (like 'Til) but removes Discogs garbage
export const cleanForSearch = (str: string): string => {
    if (!str) return '';
    return str.toLowerCase()
        .replace(/\s\(\d+\)$/, '') // Remove Discogs suffix
        .replace(/\s+/g, ' ')      // Normalize spaces
        .trim();
};

/**
 * Strip trailing edition/version markers so base titles can match across stores.
 * e.g. "Laughing So Hard, It Hurts (Laughing Edition)" → "Laughing So Hard, It Hurts"
 */
export const stripEditionSuffix = (title: string): string => {
    if (!title) return '';
    let out = title.trim();
    // Peel nested / repeated trailing parentheticals that look like editions.
    for (let i = 0; i < 3; i++) {
        const next = out
            .replace(TRAILING_EDITION_PARENS, '')
            .replace(TRAILING_EDITION_DASH, '')
            .trim();
        if (next === out) break;
        out = next;
    }
    // Also peel any single trailing parenthetical (covers "Smiling Version", "Laughing Edition", etc.).
    out = out.replace(/\s*\([^)]+\)\s*$/g, '').trim();
    return out;
};

/**
 * Title variants worth searching / comparing: full title and edition-stripped base.
 */
export const albumTitleVariants = (title: string): string[] => {
    const cleaned = cleanForSearch(title);
    if (!cleaned) return [];
    const stripped = cleanForSearch(stripEditionSuffix(title));
    const variants = [cleaned];
    if (stripped && stripped !== cleaned) variants.push(stripped);
    return variants;
};

/**
 * Calculates a similarity score between two strings based on word-by-word Levenshtein distance.
 * This version is more symmetrical and handles strings of different lengths more reliably
 * by penalizing for unmatched words.
 */
export const calculateFuzzyScore = (strA: string, strB: string): number => {
    const wordsA = tokenize(strA);
    const wordsB = tokenize(strB);

    if (wordsA.length === 0 && wordsB.length === 0) return 1;
    if (wordsA.length === 0 || wordsB.length === 0) return 0;

    let totalScore = 0;

    // For each word in A, find the BEST match in B
    wordsA.forEach(wordA => {
        let maxWordSimilarity = 0;

        wordsB.forEach(wordB => {
            const distance = getLevenshteinDistance(wordA, wordB);
            const maxLength = Math.max(wordA.length, wordB.length);
            const similarity = maxLength === 0 ? 1 : 1 - (distance / maxLength);

            if (similarity > maxWordSimilarity) {
                maxWordSimilarity = similarity;
            }
        });

        totalScore += maxWordSimilarity;
    });

    // The score is the average similarity of words in A, but is penalized by any
    // words in B that weren't matched (by using the max length as the denominator).
    // This makes the score more symmetrical and better for comparing strings of different lengths,
    // preventing a short string from getting a perfect score against a long string it's only a subset of.
    const denominator = Math.max(wordsA.length, wordsB.length);
    return totalScore / denominator;
};

/**
 * Soft containment: shorter token sequence appears in order inside the longer one.
 * e.g. "Laughing So Hard It Hurts" inside "Laughing So Hard It Hurts Laughing Edition".
 */
const tokenContainmentScore = (strA: string, strB: string): number => {
    const wordsA = tokenize(strA);
    const wordsB = tokenize(strB);
    if (wordsA.length === 0 || wordsB.length === 0) return 0;

    const [shorter, longer] = wordsA.length <= wordsB.length
        ? [wordsA, wordsB]
        : [wordsB, wordsA];

    // Require a meaningful shorter side so single-token accidents don't dominate.
    if (shorter.length < 2 && shorter[0]?.length < 4) return 0;

    let searchFrom = 0;
    let matched = 0;
    for (const word of shorter) {
        let foundAt = -1;
        for (let i = searchFrom; i < longer.length; i++) {
            const distance = getLevenshteinDistance(word, longer[i]);
            const maxLength = Math.max(word.length, longer[i].length);
            const similarity = maxLength === 0 ? 1 : 1 - (distance / maxLength);
            if (similarity >= 0.8) {
                foundAt = i;
                break;
            }
        }
        if (foundAt === -1) break;
        matched++;
        searchFrom = foundAt + 1;
    }

    if (matched < shorter.length) return 0;
    return Math.min(0.95, 0.85 + 0.1 * (shorter.length / longer.length));
};

/**
 * Like calculateFuzzyScore, but also accepts "close enough" cases where one side is the
 * base title and the other adds an edition/version suffix (or similar extra tokens).
 */
export const calculateCloseEnoughScore = (strA: string, strB: string): number => {
    let best = calculateFuzzyScore(strA, strB);
    best = Math.max(best, tokenContainmentScore(strA, strB));

    const variantsA = albumTitleVariants(strA);
    const variantsB = albumTitleVariants(strB);
    for (const a of variantsA) {
        for (const b of variantsB) {
            best = Math.max(
                best,
                calculateFuzzyScore(a, b),
                tokenContainmentScore(a, b)
            );
        }
    }

    return best;
};
