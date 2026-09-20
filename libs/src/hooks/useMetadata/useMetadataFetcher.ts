import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { DiscogsRelease, Settings } from '../../types';
import { MetadataSourceType } from '../../types';
import { fetchAppleMusicMetadata } from '../../services/appleMusic/appleMusicService';
import { fetchMusicBrainzMetadata } from '../../services/musicbrainz/musicbrainzService';
import { fetchDeezerMetadata } from '../../services/deezer/deezerService';
import type { RootState } from '../../store/index';
import { updateMetadataItem } from '../../store/metadataSlice';

const RECHECK_INTERVAL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const MAX_SESSION_QUERIES = 200;
const MAX_CONCURRENCY = 5;
const DISPATCH_INTERVAL_MS = 500;
const RATE_LIMIT_COUNT = 18;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

/** True when cached provider data is fresh AND has the fields the current settings need. */
function hasUsableProviderMetadata(
  meta: { artist?: string; album?: string; lastChecked?: number } | undefined,
  settings: Settings,
  provider: 'apple' | 'musicbrainz' | 'deezer',
  now: number
): boolean {
  if (!meta || (now - (meta.lastChecked || 0) >= RECHECK_INTERVAL_MS)) return false;

  const sourceKey = provider === 'apple' ? MetadataSourceType.Apple
    : provider === 'musicbrainz' ? MetadataSourceType.MusicBrainz
    : MetadataSourceType.Deezer;

  const needsArtist = settings.artistSource === sourceKey;
  const needsAlbum = settings.albumSource === sourceKey;

  // A lastChecked-only stamp (failed fetch) must not block refetch when we still need data.
  if (needsArtist && !meta.artist) return false;
  if (needsAlbum && !meta.album) return false;
  return true;
}

export interface MetadataFetcherOptions {
  /** Function to check if a force fetch was requested (platform-specific storage) */
  checkForceFetch?: () => boolean;
  /** Function to clear the force fetch flag */
  clearForceFetch?: () => void;
  /** Set of release IDs currently visible on screen - only these will be fetched */
  visibleIds?: Set<number>;
}

export function useMetadataFetcher(
  collection: DiscogsRelease[],
  settings: Settings,
  options: MetadataFetcherOptions = {}
) {
  const dispatch = useDispatch();
  const metadata = useSelector((state: RootState) => state.metadata.data);
  const isHydrated = useSelector((state: RootState) => state.metadata.isHydrated);

  const visibleIdsRef = useRef<Set<number>>(options.visibleIds || new Set());

  const queueRef = useRef<number[]>([]);
  const activeCountRef = useRef(0);
  const processedSessionRef = useRef<Set<number>>(new Set());
  const queuedSetRef = useRef<Set<number>>(new Set());
  const activeSetRef = useRef<Set<number>>(new Set());
  const sessionQueryCountRef = useRef(0);
  const forceFetchActiveRef = useRef(false);
  const mountedRef = useRef(true);
  const prevSettingsRef = useRef(settings);

  const abortControllerRef = useRef<AbortController>(new AbortController());
  const dispatcherIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const requestTimestampsRef = useRef<number[]>([]);

  const collectionRef = useRef(collection);
  const metadataRef = useRef(metadata);
  const settingsRef = useRef(settings);

  useEffect(() => {
    collectionRef.current = collection;
    metadataRef.current = metadata;
    settingsRef.current = settings;
    visibleIdsRef.current = options.visibleIds || new Set();
  }, [collection, metadata, settings, options.visibleIds]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortControllerRef.current.abort();
      if (dispatcherIntervalRef.current) {
        clearInterval(dispatcherIntervalRef.current);
      }
    };
  }, []);

  const processQueue = () => {
    if (!mountedRef.current) {
      if (dispatcherIntervalRef.current) clearInterval(dispatcherIntervalRef.current);
      return;
    }

    if (sessionQueryCountRef.current >= MAX_SESSION_QUERIES) {
      console.warn(`[MetadataFetcher] Session limit of ${MAX_SESSION_QUERIES} queries reached. Pausing background fetch.`);
      if (dispatcherIntervalRef.current) clearInterval(dispatcherIntervalRef.current);
      dispatcherIntervalRef.current = null;
      return;
    }

    if (queueRef.current.length === 0 && activeCountRef.current === 0) {
      if (dispatcherIntervalRef.current) clearInterval(dispatcherIntervalRef.current);
      dispatcherIntervalRef.current = null;
      forceFetchActiveRef.current = false;
      return;
    }

    const now = Date.now();
    requestTimestampsRef.current = requestTimestampsRef.current.filter(
      timestamp => now - timestamp < RATE_LIMIT_WINDOW_MS
    );

    const recentRequests = requestTimestampsRef.current.length;
    if (recentRequests >= RATE_LIMIT_COUNT) {
      return;
    }

    const rateLimitSlots = RATE_LIMIT_COUNT - recentRequests;
    const concurrencySlots = MAX_CONCURRENCY - activeCountRef.current;
    const itemsToDispatch = Math.min(queueRef.current.length, rateLimitSlots, concurrencySlots);

    if (itemsToDispatch <= 0) {
      return;
    }

    for (let i = 0; i < itemsToDispatch; i++) {
      if (abortControllerRef.current.signal.aborted) break;

      const releaseId = queueRef.current.shift()!;
      queuedSetRef.current.delete(releaseId);
      activeSetRef.current.add(releaseId);

      const release = collectionRef.current.find(r => r.id === releaseId);
      if (!release) {
        activeSetRef.current.delete(releaseId);
        continue;
      }

      const currentSettings = settingsRef.current;
      const currentMeta = metadataRef.current[releaseId];
      const signal = abortControllerRef.current.signal;

      const needsApple = currentSettings.artistSource === MetadataSourceType.Apple || currentSettings.albumSource === MetadataSourceType.Apple;
      const needsMB = currentSettings.artistSource === MetadataSourceType.MusicBrainz || currentSettings.albumSource === MetadataSourceType.MusicBrainz;
      const needsDeezer = currentSettings.artistSource === MetadataSourceType.Deezer || currentSettings.albumSource === MetadataSourceType.Deezer;

      const hasApple = hasUsableProviderMetadata(currentMeta?.apple, currentSettings, 'apple', now);
      const hasMB = hasUsableProviderMetadata(currentMeta?.musicbrainz, currentSettings, 'musicbrainz', now);
      const hasDeezer = hasUsableProviderMetadata(currentMeta?.deezer, currentSettings, 'deezer', now);

      requestTimestampsRef.current.push(Date.now());
      activeCountRef.current++;
      sessionQueryCountRef.current++;

      const tasks: Promise<void>[] = [];

      if (needsApple && (!hasApple || forceFetchActiveRef.current)) {
        tasks.push(
          fetchAppleMusicMetadata(release, currentSettings, signal, currentMeta)
            .then(result => {
              if (!mountedRef.current || signal.aborted) return;
              // Only cache real hits. A lastChecked-only miss was poisoning display for 30 days
              // (no artist → Discogs commas) after force-refresh rate limits / failed matches.
              if (!result) return;
              dispatch(updateMetadataItem({
                releaseId,
                provider: 'apple',
                metadata: { ...result, rawResult: result.rawItunesResult, lastChecked: Date.now() },
              }));
            })
            .catch(err => {
              if (err.name !== 'AbortError') console.warn(`[MetadataFetcher] Apple fetch error for ${releaseId}`, err);
            })
        );
      }

      if (needsMB && (!hasMB || forceFetchActiveRef.current)) {
        tasks.push(
          fetchMusicBrainzMetadata(release, signal)
            .then(result => {
              if (!mountedRef.current || signal.aborted || !result) return;
              dispatch(updateMetadataItem({ releaseId, provider: 'musicbrainz', metadata: { ...result, lastChecked: Date.now() } }));
            })
            .catch(err => {
              if (err.name !== 'AbortError') console.warn(`[MetadataFetcher] MusicBrainz fetch error for ${releaseId}`, err);
            })
        );
      }

      if (needsDeezer && (!hasDeezer || forceFetchActiveRef.current)) {
        tasks.push(
          fetchDeezerMetadata(release, signal)
            .then(result => {
              if (!mountedRef.current || signal.aborted || !result) return;
              dispatch(updateMetadataItem({ releaseId, provider: 'deezer', metadata: { ...result, lastChecked: Date.now() } }));
            })
            .catch(err => {
              if (err.name !== 'AbortError') console.warn(`[MetadataFetcher] Deezer fetch error for ${releaseId}`, err);
            })
        );
      }

      Promise.all(tasks).finally(() => {
        activeCountRef.current--;
        activeSetRef.current.delete(releaseId);
      });
    }
  };

  useEffect(() => {
    // Don't start fetching until Redux state is hydrated from storage
    if (!isHydrated) return;

    const forceFetch = options.checkForceFetch?.() ?? false;
    if (forceFetch) {
      console.log('[MetadataFetcher] Force fetch detected.');
      abortControllerRef.current.abort();
      abortControllerRef.current = new AbortController();

      queueRef.current = [];
      queuedSetRef.current.clear();
      activeSetRef.current.clear();
      processedSessionRef.current.clear();
      sessionQueryCountRef.current = 0;
      activeCountRef.current = 0;
      requestTimestampsRef.current = [];
      forceFetchActiveRef.current = true;

      if (dispatcherIntervalRef.current) {
        clearInterval(dispatcherIntervalRef.current);
        dispatcherIntervalRef.current = null;
      }
      options.clearForceFetch?.();
    }

    const currentSettings = settingsRef.current;
    const prevSettings = prevSettingsRef.current;

    const settingsChanged =
      currentSettings.artistSource !== prevSettings.artistSource ||
      currentSettings.albumSource !== prevSettings.albumSource;

    prevSettingsRef.current = currentSettings;

    const needsAny =
      currentSettings.artistSource !== MetadataSourceType.Discogs ||
      currentSettings.albumSource !== MetadataSourceType.Discogs;

    if (!needsAny) {
      if (queueRef.current.length > 0 || activeCountRef.current > 0) {
        abortControllerRef.current.abort();
        abortControllerRef.current = new AbortController();
        queueRef.current = [];
        queuedSetRef.current.clear();
        activeSetRef.current.clear();
        if (dispatcherIntervalRef.current) {
          clearInterval(dispatcherIntervalRef.current);
          dispatcherIntervalRef.current = null;
        }
      }
      return;
    }

    if (settingsChanged) {
      processedSessionRef.current.clear();
      sessionQueryCountRef.current = 0;
    }

    const now = Date.now();
    let addedCount = 0;

    collection.forEach(release => {
      const releaseId = release.id;

      // If a visible set is provided, only fetch for on-screen releases.
      if (visibleIdsRef.current.size > 0 && !visibleIdsRef.current.has(releaseId)) return;

      if (queuedSetRef.current.has(releaseId)) return;
      if (activeSetRef.current.has(releaseId)) return;
      if (!settingsChanged && processedSessionRef.current.has(releaseId)) return;

      const meta = metadataRef.current[releaseId];

      const needsApple = currentSettings.artistSource === MetadataSourceType.Apple || currentSettings.albumSource === MetadataSourceType.Apple;
      const needsMB = currentSettings.artistSource === MetadataSourceType.MusicBrainz || currentSettings.albumSource === MetadataSourceType.MusicBrainz;
      const needsDeezer = currentSettings.artistSource === MetadataSourceType.Deezer || currentSettings.albumSource === MetadataSourceType.Deezer;

      const hasApple = hasUsableProviderMetadata(meta?.apple, currentSettings, 'apple', now);
      const hasMB = hasUsableProviderMetadata(meta?.musicbrainz, currentSettings, 'musicbrainz', now);
      const hasDeezer = hasUsableProviderMetadata(meta?.deezer, currentSettings, 'deezer', now);

      if (forceFetch || (needsApple && !hasApple) || (needsMB && !hasMB) || (needsDeezer && !hasDeezer)) {
        queueRef.current.push(releaseId);
        queuedSetRef.current.add(releaseId);
        processedSessionRef.current.add(releaseId);
        addedCount++;
      }
    });

    if (addedCount > 0 && dispatcherIntervalRef.current === null) {
      processQueue();
      dispatcherIntervalRef.current = setInterval(processQueue, DISPATCH_INTERVAL_MS);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collection, settings, isHydrated]);
}
