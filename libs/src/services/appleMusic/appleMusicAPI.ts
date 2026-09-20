import type { ITunesResponse } from '../../types';

const REQUEST_TIMEOUT_MS = 10000; // 10 seconds per request
/** Apple's Search API is ~20 calls/min; stay under that across the whole app. */
const MIN_REQUEST_INTERVAL_MS = 3500;
const RATE_LIMIT_COOLDOWN_MS = 60_000;
const ITUNES_SEARCH = 'https://itunes.apple.com/search';

export class AppleMusicRateLimitError extends Error {
    constructor(message = 'Apple Music Search API rate limited (403)') {
        super(message);
        this.name = 'AppleMusicRateLimitError';
    }
}

let lastRequestAt = 0;
let cooldownUntil = 0;
/** Serialize all iTunes HTTP calls so concurrent releases share one budget. */
let requestGate: Promise<void> = Promise.resolve();

const sleep = (ms: number, signal?: AbortSignal): Promise<void> =>
    new Promise((resolve, reject) => {
        if (signal?.aborted) {
            reject(new DOMException('Aborted', 'AbortError'));
            return;
        }
        const timeoutId = setTimeout(() => {
            signal?.removeEventListener('abort', onAbort);
            resolve();
        }, ms);
        const onAbort = () => {
            clearTimeout(timeoutId);
            reject(new DOMException('Aborted', 'AbortError'));
        };
        signal?.addEventListener('abort', onAbort, { once: true });
    });

const waitForRateBudget = async (signal?: AbortSignal): Promise<void> => {
    const run = async () => {
        const now = Date.now();
        const waitUntil = Math.max(cooldownUntil, lastRequestAt + MIN_REQUEST_INTERVAL_MS);
        const delay = waitUntil - now;
        if (delay > 0) await sleep(delay, signal);
        lastRequestAt = Date.now();
    };

    const wait = requestGate.then(run, run);
    requestGate = wait.then(() => undefined, () => undefined);
    await wait;
};

/** Clear a prior 403 cooldown (e.g. user explicitly refreshed one album). */
export const clearAppleMusicCooldown = (): void => {
    cooldownUntil = 0;
};

const buildSearchQuery = (
    strategyQuery: string,
    entity: 'album' | 'musicArtist' | undefined,
    omitEntity: boolean,
    attribute: 'artistTerm' | 'albumTerm' | undefined,
    offset: number
): string => {
    const encodedQuery = encodeURIComponent(strategyQuery);
    let qs = `term=${encodedQuery}&media=music&limit=200&offset=${offset}`;
    if (entity) qs += `&entity=${entity}`;
    else if (!omitEntity) qs += `&entity=album`;
    if (attribute) qs += `&attribute=${attribute}`;
    return qs;
};

/**
 * Browser: same-origin `/api/itunes/search` (Vite proxy → Apple; avoids CORS).
 * Native: hit Apple directly (no CORS).
 */
const resolveSearchUrl = (qs: string): string => {
    const isBrowser = typeof document !== 'undefined';
    if (isBrowser) return `/api/itunes/search?${qs}`;
    return `${ITUNES_SEARCH}?${qs}`;
};

/**
 * Raw requests to the Apple Music (iTunes) Search API.
 */
export const fetchFromAppleMusic = async (
    strategyQuery: string,
    entity: 'album' | 'musicArtist' | undefined,
    omitEntity: boolean,
    attribute: 'artistTerm' | 'albumTerm' | undefined,
    offset: number,
    parentSignal: AbortSignal | undefined
): Promise<ITunesResponse> => {
    const pageRequestController = new AbortController();
    const timeoutId = setTimeout(() => pageRequestController.abort(), REQUEST_TIMEOUT_MS);

    const onParentAbort = () => pageRequestController.abort();
    if (parentSignal) parentSignal.addEventListener('abort', onParentAbort);

    try {
        await waitForRateBudget(parentSignal);

        const qs = buildSearchQuery(strategyQuery, entity, omitEntity, attribute, offset);
        const url = resolveSearchUrl(qs);
        const response = await fetch(url, { signal: pageRequestController.signal });

        if (response.status === 403) {
            cooldownUntil = Date.now() + RATE_LIMIT_COOLDOWN_MS;
            console.warn(`[Apple Music API] 403 rate limit — cooling down ${RATE_LIMIT_COOLDOWN_MS / 1000}s`);
            throw new AppleMusicRateLimitError();
        }

        if (!response.ok) {
            throw new Error(`Apple Music API responded with status ${response.status}`);
        }

        return await response.json() as ITunesResponse;
    } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') {
            if (parentSignal?.aborted) {
                throw new DOMException('Aborted by parent', 'AbortError');
            }
            console.warn(`[Apple Music API] Request timed out for query: "${strategyQuery}"`);
        }
        throw e;
    } finally {
        clearTimeout(timeoutId);
        if (parentSignal) parentSignal.removeEventListener('abort', onParentAbort);
    }
};
