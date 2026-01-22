/**
 * useMetadataFetcher - Orchestrates background metadata enrichment
 *
 * Fetches artist and album information from Apple Music and MusicBrainz
 * to supplement or correct metadata from Discogs based on user settings.
 *
 * Key features:
 * - Rate limiting (18 requests per 60 seconds)
 * - Concurrency control (max 5 parallel requests)
 * - Session limit (200 total queries per session)
 * - 30-day cache TTL before re-checking
 * - Graceful abort on unmount or settings change
 */
import { useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { DiscogsRelease, Settings, CombinedMetadata, ServiceMetadata } from '@libs';
import { fetchAppleMusicMetadata, fetchMusicBrainzMetadata } from '@libs';
import { updateMetadataItem } from '../../../../libs/src/store/metadataSlice';
import type { RootState } from '../../../../libs/src/store';

// Configuration constants
const RECHECK_INTERVAL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const MAX_SESSION_QUERIES = 200;
const MAX_CONCURRENCY = 5;
const DISPATCH_INTERVAL_MS = 500;
const RATE_LIMIT_COUNT = 18;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 60 seconds

export function useMetadataFetcher(
  collection: DiscogsRelease[],
  settings: Settings
) {
  const dispatch = useDispatch();
  const metadata = useSelector((state: RootState) => state.metadata.data);
  const isHydrated = useSelector((state: RootState) => state.metadata.isHydrated);

  // Refs for managing state without re-renders
  const mountedRef = useRef(true);
  const abortControllerRef = useRef(new AbortController());
  const dispatcherIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Queue management refs
  const queueRef = useRef<number[]>([]);
  const queuedSetRef = useRef<Set<number>>(new Set());
  const activeCountRef = useRef(0);
  const activeSetRef = useRef<Set<number>>(new Set());

  // Rate limiting refs
  const requestTimestampsRef = useRef<number[]>([]);
  const sessionQueryCountRef = useRef(0);
  const processedThisSessionRef = useRef<Set<number>>(new Set());

  // Settings tracking
  const prevSettingsRef = useRef<{ artistSource: string; albumSource: string } | null>(null);

  /**
   * Process items from the queue respecting rate limits and concurrency
   */
  const processQueue = useCallback(() => {
    if (!mountedRef.current) return;
    if (queueRef.current.length === 0) return;

    // Check session limit
    if (sessionQueryCountRef.current >= MAX_SESSION_QUERIES) {
      console.log('[MetadataFetcher] Session query limit reached. Pausing background fetch.');
      return;
    }

    const now = Date.now();

    // Check rate limit - filter timestamps within the window
    requestTimestampsRef.current = requestTimestampsRef.current.filter(
      ts => now - ts < RATE_LIMIT_WINDOW_MS
    );
    const rateLimitSlots = RATE_LIMIT_COUNT - requestTimestampsRef.current.length;
    if (rateLimitSlots <= 0) return;

    // Check concurrency limit
    const concurrencySlots = MAX_CONCURRENCY - activeCountRef.current;
    if (concurrencySlots <= 0) return;

    // Determine how many items to process
    const slotsAvailable = Math.min(
      queueRef.current.length,
      rateLimitSlots,
      concurrencySlots,
      MAX_SESSION_QUERIES - sessionQueryCountRef.current
    );

    if (slotsAvailable <= 0) return;

    // Pop items from queue
    const itemsToProcess = queueRef.current.splice(0, slotsAvailable);
    const signal = abortControllerRef.current.signal;

    for (const releaseId of itemsToProcess) {
      // Find the release in collection
      const release = collection.find(r => r.id === releaseId);
      if (!release) {
        queuedSetRef.current.delete(releaseId);
        continue;
      }

      // Mark as active
      activeCountRef.current++;
      activeSetRef.current.add(releaseId);
      queuedSetRef.current.delete(releaseId);
      processedThisSessionRef.current.add(releaseId);

      // Record timestamp for rate limiting
      requestTimestampsRef.current.push(Date.now());
      sessionQueryCountRef.current++;

      // Determine what to fetch based on settings
      const needsApple = settings.artistSource === 'apple' || settings.albumSource === 'apple';
      const needsMusicBrainz = settings.artistSource === 'musicbrainz' || settings.albumSource === 'musicbrainz';

      const tasks: Promise<void>[] = [];

      if (needsApple) {
        tasks.push(
          fetchAppleMusicMetadata(release, settings, signal)
            .then(result => {
              if (!mountedRef.current || signal.aborted) return;
              const finalResult: ServiceMetadata = result
                ? {
                  artist: result.artist,
                  album: result.album,
                  primaryGenreName: result.primaryGenreName,
                  copyright: result.copyright,
                  country: result.country,
                  explicit: result.explicit,
                  score: result.score,
                  rawResult: result.rawItunesResult,
                  lastChecked: Date.now(),
                }
                : { lastChecked: Date.now() };
              dispatch(updateMetadataItem({ releaseId, provider: 'apple', metadata: finalResult }));
            })
            .catch(err => {
              if (err.name !== 'AbortError') {
                console.warn(`[MetadataFetcher] Apple fetch error for ${releaseId}`, err);
              }
            })
        );
      }

      if (needsMusicBrainz) {
        tasks.push(
          fetchMusicBrainzMetadata(release, signal)
            .then(result => {
              if (!mountedRef.current || signal.aborted) return;
              const finalResult: ServiceMetadata = result
                ? { ...result, lastChecked: Date.now() }
                : { lastChecked: Date.now() };
              dispatch(updateMetadataItem({ releaseId, provider: 'musicbrainz', metadata: finalResult }));
            })
            .catch(err => {
              if (err.name !== 'AbortError') {
                console.warn(`[MetadataFetcher] MusicBrainz fetch error for ${releaseId}`, err);
              }
            })
        );
      }

      // Cleanup when all tasks complete
      Promise.all(tasks).finally(() => {
        activeCountRef.current--;
        activeSetRef.current.delete(releaseId);
      });
    }
  }, [collection, settings, dispatch]);

  /**
   * Check if cached metadata is still fresh
   */
  const isFresh = useCallback((cached: CombinedMetadata | undefined, provider: 'apple' | 'musicbrainz'): boolean => {
    if (!cached) return false;
    const providerData = cached[provider];
    if (!providerData?.lastChecked) return false;
    return Date.now() - providerData.lastChecked < RECHECK_INTERVAL_MS;
  }, []);

  /**
   * Build the queue when collection or settings change
   */
  useEffect(() => {
    if (!isHydrated) return;
    if (!collection.length) return;

    // Check if settings changed - if so, reset session state
    const currentSettingsKey = { artistSource: settings.artistSource, albumSource: settings.albumSource };
    if (prevSettingsRef.current) {
      if (
        prevSettingsRef.current.artistSource !== currentSettingsKey.artistSource ||
        prevSettingsRef.current.albumSource !== currentSettingsKey.albumSource
      ) {
        // Settings changed - reset session state
        processedThisSessionRef.current.clear();
        sessionQueryCountRef.current = 0;
        queueRef.current = [];
        queuedSetRef.current.clear();
      }
    }
    prevSettingsRef.current = currentSettingsKey;

    // If both sources are Discogs, no need to fetch metadata
    if (settings.artistSource === 'discogs' && settings.albumSource === 'discogs') {
      // Clear queue and abort pending requests
      queueRef.current = [];
      queuedSetRef.current.clear();
      abortControllerRef.current.abort();
      abortControllerRef.current = new AbortController();
      return;
    }

    const needsApple = settings.artistSource === 'apple' || settings.albumSource === 'apple';
    const needsMusicBrainz = settings.artistSource === 'musicbrainz' || settings.albumSource === 'musicbrainz';

    // Build queue from collection
    for (const release of collection) {
      const releaseId = release.id;

      // Skip if already queued, active, or processed this session
      if (queuedSetRef.current.has(releaseId)) continue;
      if (activeSetRef.current.has(releaseId)) continue;
      if (processedThisSessionRef.current.has(releaseId)) continue;

      const cached = metadata[releaseId];

      // Check if we need to fetch
      const needsAppleFetch = needsApple && !isFresh(cached, 'apple');
      const needsMusicBrainzFetch = needsMusicBrainz && !isFresh(cached, 'musicbrainz');

      if (needsAppleFetch || needsMusicBrainzFetch) {
        queueRef.current.push(releaseId);
        queuedSetRef.current.add(releaseId);
      }
    }
  }, [collection, settings, metadata, isHydrated, isFresh]);

  /**
   * Start the processing interval
   */
  useEffect(() => {
    mountedRef.current = true;

    // Start dispatcher interval
    dispatcherIntervalRef.current = setInterval(() => {
      processQueue();
    }, DISPATCH_INTERVAL_MS);

    return () => {
      mountedRef.current = false;
      abortControllerRef.current.abort();
      if (dispatcherIntervalRef.current) {
        clearInterval(dispatcherIntervalRef.current);
      }
    };
  }, [processQueue]);
}
