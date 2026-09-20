
import type { DiscogsRelease, Settings, ITunesResult, AppleSearchStrategy } from '../../types';
import {
    generateArtistSearchStrategies,
    generateAlbumSearchStrategies,
    buildOneArtistCorrectedCollabQueries,
} from './strategies';
import { calculateTruthScore, isBetterTieBreak, getScores, getDiscogsReleaseType, getAppleReleaseType } from './scoring';
import { AppleSearchStrategyType, ReleaseType } from '../../types';
import { formatArtistsForMetadataSearch } from '../../utils/formattingUtils';
import { albumTitleVariants, calculateCloseEnoughScore, cleanForSearch } from '../../utils/fuzzyUtils';
import { AppleMusicRateLimitError, fetchFromAppleMusic } from './appleMusicAPI';
import type { AppleMusicMetadata, CombinedMetadata } from '../../types';

// Strict threshold for acceptance
const ACCEPTANCE_THRESHOLD = 0.85;
/** When the album anchor is strong, accept a weaker artist match (collabs / stylization). */
const STRONG_ALBUM_ANCHOR = 0.85;
const RELAXED_ARTIST_FLOOR = 0.4;
const PRE_FILTER_THRESHOLD = 0.3; // Low bar to weed out completely wrong results
const ANCHOR_FIELD_VALIDATION_THRESHOLD = 0.7; // Threshold to confirm API returned a relevant result
/** ArtistName is a plausible stylization / joiner fix of the Discogs credit. */
const ARTIST_CORRECTION_FLOOR = 0.55;
const MAX_CORRECTED_ARTIST_RETRIES = 3;

type MatchResult = {
    bestMatch: ITunesResult | null;
    bestScore: number;
    bestStrategy: AppleSearchStrategy | null;
    rateLimited?: boolean;
};

/** Best close-enough score of an Apple album title against Discogs title variants. */
const albumResemblanceScore = (discogsTitle: string, appleAlbumTitle: string): number => {
    let best = calculateCloseEnoughScore(discogsTitle, appleAlbumTitle);
    for (const variant of albumTitleVariants(discogsTitle)) {
        best = Math.max(best, calculateCloseEnoughScore(variant, appleAlbumTitle));
    }
    return best;
};

/** How closely an Apple artistName resembles the Discogs credit (for correction harvest). */
const artistResemblanceScore = (release: DiscogsRelease, appleArtist: string): number => {
    const info = release.basic_information;
    const searchArtist = info.artists?.length
        ? formatArtistsForMetadataSearch(info.artists)
        : info.artist_display_name;
    let best = Math.max(
        calculateCloseEnoughScore(searchArtist, appleArtist),
        calculateCloseEnoughScore(info.artist_display_name, appleArtist)
    );
    for (const artist of info.artists ?? []) {
        const name = artist.anv || artist.name;
        if (name) best = Math.max(best, calculateCloseEnoughScore(name, appleArtist));
    }
    return best;
};

/**
 * Run a list of strategies, scoring album-anchored hits. Optionally harvest Apple
 * artistNames that look like corrections of the Discogs credit.
 */
const runStrategies = async (
    strategies: AppleSearchStrategy[],
    releaseForSearch: DiscogsRelease,
    settingsForThisRun: Settings,
    parentSignal: AbortSignal | undefined,
    releaseForScoring: DiscogsRelease,
    seed: MatchResult,
    correctedArtists: Set<string>,
    triedArtistQueries: Set<string>
): Promise<MatchResult> => {
    const discogsTitle = releaseForScoring.basic_information.title;
    let overallBestMatch = seed.bestMatch;
    let overallBestScore = seed.bestScore;
    let bestMatchStrategy = seed.bestStrategy;

    for (const strategy of strategies) {
        if (parentSignal?.aborted) throw new DOMException('Aborted by parent', 'AbortError');
        if (strategy.attribute === 'artistTerm') {
            triedArtistQueries.add(cleanForSearch(strategy.query));
        }

        let currentOffset = 0;
        let hasMorePages = true;
        let totalResultsFromServer = -1;

        while (hasMorePages) {
            if (parentSignal?.aborted) throw new DOMException('Aborted by parent', 'AbortError');

            try {
                const data = await fetchFromAppleMusic(
                    strategy.query,
                    strategy.entity,
                    !!strategy.omitEntity,
                    strategy.attribute,
                    currentOffset,
                    parentSignal
                );

                if (totalResultsFromServer === -1) totalResultsFromServer = data.resultCount;

                if (data.resultCount > 0 && data.results.length > 0) {
                    const discogsType = getDiscogsReleaseType(releaseForScoring);

                    for (const result of data.results) {
                        if (result.wrapperType !== 'collection' || result.collectionType !== 'Album') continue;

                        const albumScore = albumResemblanceScore(discogsTitle, result.collectionName);
                        const artistScoreVsDiscogs = artistResemblanceScore(releaseForScoring, result.artistName);

                        // Harvest corrected Apple artist spellings / joiners when they still
                        // look like the same Discogs credit (even if this album isn't ours).
                        if (
                            result.artistName &&
                            artistScoreVsDiscogs >= ARTIST_CORRECTION_FLOOR
                        ) {
                            const cleaned = cleanForSearch(result.artistName);
                            if (cleaned && !triedArtistQueries.has(cleaned)) {
                                correctedArtists.add(result.artistName);
                            }
                        }

                        // Strong album hit from album-title search → Apple's artistName is the correction.
                        if (
                            strategy.attribute === 'albumTerm' &&
                            albumScore >= STRONG_ALBUM_ANCHOR &&
                            result.artistName
                        ) {
                            const cleaned = cleanForSearch(result.artistName);
                            if (cleaned && !triedArtistQueries.has(cleaned)) {
                                correctedArtists.add(result.artistName);
                            }
                        }

                        const appleType = getAppleReleaseType(result);
                        if (discogsType !== ReleaseType.UNKNOWN) {
                            if (discogsType !== ReleaseType.SINGLE && appleType === ReleaseType.SINGLE) continue;
                            if (
                                discogsType !== ReleaseType.EP &&
                                appleType === ReleaseType.EP &&
                                albumScore < STRONG_ALBUM_ANCHOR
                            ) {
                                continue;
                            }
                            if (discogsType === ReleaseType.SINGLE && appleType === ReleaseType.ALBUM) continue;
                        }

                        if (strategy.attribute === 'albumTerm') {
                            if (calculateCloseEnoughScore(strategy.query, result.collectionName) < ANCHOR_FIELD_VALIDATION_THRESHOLD) {
                                continue;
                            }
                        } else if (strategy.attribute === 'artistTerm') {
                            if (albumScore < ANCHOR_FIELD_VALIDATION_THRESHOLD) continue;
                        }

                        const { artistScore, albumScore: scoredAlbum } = getScores(releaseForScoring, result);
                        if (scoredAlbum <= PRE_FILTER_THRESHOLD) continue;
                        if (strategy.type === AppleSearchStrategyType.ARTIST_PLUS_YEAR && artistScore <= PRE_FILTER_THRESHOLD) {
                            continue;
                        }

                        let score = calculateTruthScore(releaseForScoring, result, strategy, settingsForThisRun);
                        if (
                            score < ACCEPTANCE_THRESHOLD &&
                            scoredAlbum >= STRONG_ALBUM_ANCHOR &&
                            artistScore >= RELAXED_ARTIST_FLOOR
                        ) {
                            score = Math.max(score, Math.min(0.92, 0.7 * scoredAlbum + 0.3 * artistScore));
                        }

                        if (score > overallBestScore) {
                            overallBestScore = score;
                            overallBestMatch = result;
                            bestMatchStrategy = strategy;
                        } else if (
                            score === overallBestScore &&
                            overallBestScore > 0 &&
                            overallBestMatch &&
                            isBetterTieBreak(releaseForScoring, result, overallBestMatch, settingsForThisRun)
                        ) {
                            overallBestMatch = result;
                            bestMatchStrategy = strategy;
                        }
                    }
                }

                if (overallBestScore >= ACCEPTANCE_THRESHOLD) {
                    hasMorePages = false;
                } else {
                    currentOffset += data.results.length;
                    if (data.results.length < 200 || currentOffset >= totalResultsFromServer) hasMorePages = false;
                }
            } catch (e) {
                hasMorePages = false;
                if (e instanceof DOMException && e.name === 'AbortError' && parentSignal?.aborted) {
                    throw e;
                }
                if (e instanceof AppleMusicRateLimitError) {
                    console.warn(`[Apple Music] Rate limited; stopping search early (best so far ${(overallBestScore * 100).toFixed(1)}%).`);
                    return {
                        bestMatch: overallBestMatch,
                        bestScore: overallBestScore,
                        bestStrategy: bestMatchStrategy,
                        rateLimited: true,
                    };
                }
                console.warn(`[Apple Music] Strategy page failed for query "${strategy.query}".`, e);
            }
        }
        if (overallBestScore >= ACCEPTANCE_THRESHOLD) break;
    }

    return {
        bestMatch: overallBestMatch,
        bestScore: overallBestScore,
        bestStrategy: bestMatchStrategy,
    };
};

/**
 * 1. Search by Discogs artist(s) for albums resembling the Discogs title.
 * 2. If no close album: discover corrected Apple artist names (album-title search +
 *    stylized artistNames from step 1), then retry artist → album under those names.
 */
const findBestMatch = async (
    releaseForSearch: DiscogsRelease,
    settingsForThisRun: Settings,
    parentSignal: AbortSignal | undefined,
    releaseForScoring: DiscogsRelease,
    _metadata?: CombinedMetadata
): Promise<MatchResult> => {
    const correctedArtists = new Set<string>();
    const triedArtistQueries = new Set<string>();
    let state: MatchResult = { bestMatch: null, bestScore: 0, bestStrategy: null };

    // Pass 1: Discogs artist names (combined + separated) → resembling albums.
    const artistStrategies = generateArtistSearchStrategies(releaseForSearch, settingsForThisRun);
    state = await runStrategies(
        artistStrategies,
        releaseForSearch,
        settingsForThisRun,
        parentSignal,
        releaseForScoring,
        state,
        correctedArtists,
        triedArtistQueries
    );
    if (state.rateLimited || state.bestScore >= ACCEPTANCE_THRESHOLD) return state;

    // Pass 2: album-title search — finds the release when Discogs artist spelling
    // didn't land in the right catalog, and harvests Apple's artistName as a correction.
    const albumStrategies = generateAlbumSearchStrategies(releaseForSearch, settingsForThisRun);
    state = await runStrategies(
        albumStrategies,
        releaseForSearch,
        settingsForThisRun,
        parentSignal,
        releaseForScoring,
        state,
        correctedArtists,
        triedArtistQueries
    );
    if (state.rateLimited || state.bestScore >= ACCEPTANCE_THRESHOLD) return state;

    // Pass 3: no close album under Discogs artists — retry with corrected Apple artist names,
    // and (for collabs) with the closest member so far substituted when nothing similar matched.
    const fullCorrections = [...correctedArtists]
        .filter(name => {
            const cleaned = cleanForSearch(name);
            return cleaned && !triedArtistQueries.has(cleaned);
        })
        .slice(0, MAX_CORRECTED_ARTIST_RETRIES);

    const nothingSimilar = state.bestScore < ANCHOR_FIELD_VALIDATION_THRESHOLD;
    const partialCollabCorrections = nothingSimilar
        ? buildOneArtistCorrectedCollabQueries(
            releaseForSearch,
            correctedArtists,
            triedArtistQueries
        ).slice(0, MAX_CORRECTED_ARTIST_RETRIES)
        : [];

    const retryQueries = [...new Set([...fullCorrections, ...partialCollabCorrections])];
    if (retryQueries.length === 0) return state;

    console.log(
        `[Apple Music] No close album under Discogs artist(s); retrying with corrected artist name(s): ${retryQueries.join(' | ')}`
    );
    const retryStrategies = generateArtistSearchStrategies(
        releaseForSearch,
        settingsForThisRun,
        retryQueries
    ).filter(s => !triedArtistQueries.has(cleanForSearch(s.query)));

    return runStrategies(
        retryStrategies,
        releaseForSearch,
        settingsForThisRun,
        parentSignal,
        releaseForScoring,
        state,
        correctedArtists,
        triedArtistQueries
    );
};

const processFinalResult = (
    result: MatchResult,
    release: DiscogsRelease,
    settings: Settings
): AppleMusicMetadata | null => {

    if (!result.bestMatch || result.bestScore < ACCEPTANCE_THRESHOLD) {
        console.log(`[Apple Music] No acceptable match found for "${release.basic_information.artist_display_name} - ${release.basic_information.title}". Best score: ${(result.bestScore * 100).toFixed(1)}%`);
        return null;
    }

    const finalArtist = result.bestMatch.artistName;
    const albumSourceIsApple = settings.albumSource === 'apple';
    const finalAlbum = albumSourceIsApple ? result.bestMatch.collectionName : undefined;

    const discogsArtist = release.basic_information.artist_display_name;
    const discogsTitle = release.basic_information.title;
    const hasFinalArtistChanged = finalArtist !== discogsArtist;
    const hasFinalAlbumChanged = finalAlbum && finalAlbum !== discogsTitle;

    if (hasFinalArtistChanged || hasFinalAlbumChanged) {
        const strategyDesc = result.bestStrategy ? `${result.bestStrategy.type} (${result.bestStrategy.attribute || result.bestStrategy.entity || 'Broad'})` : 'Unknown';
        console.log(`[Apple Music] Final Update (${Math.round(result.bestScore * 100)}% match via ${strategyDesc}):\n  D: ${discogsArtist} - ${discogsTitle}\n  A: ${finalArtist} - ${finalAlbum || '(N/A)'}`);
    }

    return {
        artist: finalArtist,
        album: finalAlbum,
        primaryGenreName: result.bestMatch.primaryGenreName,
        copyright: result.bestMatch.copyright,
        country: result.bestMatch.country,
        explicit: result.bestMatch.collectionExplicitness === 'explicit',
        score: result.bestScore,
        rawItunesResult: result.bestMatch,
    };
};

/**
 * The main exported function that orchestrates the entire metadata fetching process for a single release.
 */
export const fetchAppleMusicMetadata = async (
    release: DiscogsRelease,
    settings: Settings,
    parentSignal?: AbortSignal,
    metadata?: CombinedMetadata
): Promise<AppleMusicMetadata | null> => {
    if (!release || !release.basic_information) return null;

    const bestResultSoFar = await findBestMatch(release, settings, parentSignal, release, metadata);
    return processFinalResult(bestResultSoFar, release, settings);
};
