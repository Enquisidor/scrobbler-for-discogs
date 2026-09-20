import { useCallback, useEffect, useRef } from 'react';
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
/** Keep low: each release can fire multiple iTunes HTTP calls; Apple caps ~20/min. */
const MAX_CONCURRENCY = 2;
const DISPATCH_INTERVAL_MS = 500;
const RATE_LIMIT_COUNT = 12;
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
}

export interface MetadataFetcherControls {
  /** Force-refetch metadata for one queued release; keeps existing cache if the fetch fails. */
  refreshRelease: (releaseId: number) => void;
}

/**
 * Fetches external metadata (Apple / MusicBrainz / Deezer) only for the releases
 * passed in — callers should pass albums currently in the scrobble queue.
 */
export function useMetadataFetcher(
  queuedReleases: DiscogsRelease[],
  settings: Settings,
  options: MetadataFetcherOptions = {}
): MetadataFetcherControls {
  const dispatch = useDispatch();
  const metadata = useSelector((state: RootState) => state.metadata.data);
  const isHydrated = useSelector((state: RootState) => state.metadata.isHydrated);

  const fetchQueueRef = useRef<number[]>([]);
  const activeCountRef = useRef(0);
  const processedSessionRef = useRef<Set<number>>(new Set());
  const queuedSetRef = useRef<Set<number>>(new Set());
  const activeSetRef = useRef<Set<number>>(new Set());
  const forceIdsRef = useRef<Set<number>>(new Set());
  const sessionQueryCountRef = useRef(0);
  const forceFetchActiveRef = useRef(false);
  const mountedRef = useRef(true);
  const prevSettingsRef = useRef(settings);

  const abortControllerRef = useRef<AbortController>(new AbortController());
  const dispatcherIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const requestTimestampsRef = useRef<number[]>([]);

  const releasesRef = useRef(queuedReleases);
  const metadataRef = useRef(metadata);
  const settingsRef = useRef(settings);
  const processQueueRef = useRef<() => void>(() => undefined);

  useEffect(() => {
    releasesRef.current = queuedReleases;
    metadataRef.current = metadata;
    settingsRef.current = settings;
  }, [queuedReleases, metadata, settings]);

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

  const ensureDispatcher = () => {
    if (dispatcherIntervalRef.current === null) {
      dispatcherIntervalRef.current = setInterval(() => processQueueRef.current(), DISPATCH_INTERVAL_MS);
    }
  };

  const enqueueRelease = (releaseId: number, force: boolean) => {
    if (force) forceIdsRef.current.add(releaseId);
    if (queuedSetRef.current.has(releaseId) || activeSetRef.current.has(releaseId)) return;
    fetchQueueRef.current.push(releaseId);
    queuedSetRef.current.add(releaseId);
    processedSessionRef.current.add(releaseId);
  };

  const processQueue = () => {
    if (!mountedRef.current) {
      if (dispatcherIntervalRef.current) clearInterval(dispatcherIntervalRef.current);
      return;
    }

    if (sessionQueryCountRef.current >= MAX_SESSION_QUERIES) {
      console.warn(`[MetadataFetcher] Session limit of ${MAX_SESSION_QUERIES} queries reached. Pausing fetch.`);
      if (dispatcherIntervalRef.current) clearInterval(dispatcherIntervalRef.current);
      dispatcherIntervalRef.current = null;
      return;
    }

    if (fetchQueueRef.current.length === 0 && activeCountRef.current === 0) {
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
    const itemsToDispatch = Math.min(fetchQueueRef.current.length, rateLimitSlots, concurrencySlots);

    if (itemsToDispatch <= 0) {
      return;
    }

    for (let i = 0; i < itemsToDispatch; i++) {
      if (abortControllerRef.current.signal.aborted) break;

      const releaseId = fetchQueueRef.current.shift()!;
      queuedSetRef.current.delete(releaseId);
      activeSetRef.current.add(releaseId);
      const forceThis = forceFetchActiveRef.current || forceIdsRef.current.has(releaseId);
      if (forceThis) forceIdsRef.current.delete(releaseId);

      const release = releasesRef.current.find(r => r.id === releaseId);
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

      if (needsApple && (!hasApple || forceThis)) {
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

      if (needsMB && (!hasMB || forceThis)) {
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

      if (needsDeezer && (!hasDeezer || forceThis)) {
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
        // A refresh requested while this fetch was in flight — run again with force.
        if (forceIdsRef.current.has(releaseId)) {
          enqueueRelease(releaseId, true);
        }
      });
    }
  };

  processQueueRef.current = processQueue;

  const refreshRelease = useCallback((releaseId: number) => {
    if (!releasesRef.current.some(r => r.id === releaseId)) return;

    const needsAny =
      settingsRef.current.artistSource !== MetadataSourceType.Discogs ||
      settingsRef.current.albumSource !== MetadataSourceType.Discogs;
    if (!needsAny) return;

    processedSessionRef.current.delete(releaseId);
    forceIdsRef.current.add(releaseId);
    if (!queuedSetRef.current.has(releaseId) && !activeSetRef.current.has(releaseId)) {
      fetchQueueRef.current.push(releaseId);
      queuedSetRef.current.add(releaseId);
      processedSessionRef.current.add(releaseId);
    }
    processQueueRef.current();
    ensureDispatcher();
  }, []);

  useEffect(() => {
    // Don't start fetching until Redux state is hydrated from storage
    if (!isHydrated) return;

    const forceFetch = options.checkForceFetch?.() ?? false;
    if (forceFetch) {
      console.log('[MetadataFetcher] Force fetch detected.');
      abortControllerRef.current.abort();
      abortControllerRef.current = new AbortController();

      fetchQueueRef.current = [];
      queuedSetRef.current.clear();
      activeSetRef.current.clear();
      forceIdsRef.current.clear();
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
      if (fetchQueueRef.current.length > 0 || activeCountRef.current > 0) {
        abortControllerRef.current.abort();
        abortControllerRef.current = new AbortController();
        fetchQueueRef.current = [];
        queuedSetRef.current.clear();
        activeSetRef.current.clear();
        forceIdsRef.current.clear();
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

    // Deduplicate by release id (album may appear more than once in the scrobble queue).
    const uniqueById = new Map<number, DiscogsRelease>();
    for (const release of queuedReleases) {
      const existing = uniqueById.get(release.id);
      if (!existing || (!(existing as { tracklist?: unknown }).tracklist && (release as { tracklist?: unknown }).tracklist)) {
        uniqueById.set(release.id, release);
      }
    }
    releasesRef.current = Array.from(uniqueById.values());

    for (const release of uniqueById.values()) {
      const releaseId = release.id;

      if (queuedSetRef.current.has(releaseId)) continue;
      if (activeSetRef.current.has(releaseId)) continue;
      if (!settingsChanged && !forceFetch && processedSessionRef.current.has(releaseId)) continue;

      const meta = metadataRef.current[releaseId];

      const needsApple = currentSettings.artistSource === MetadataSourceType.Apple || currentSettings.albumSource === MetadataSourceType.Apple;
      const needsMB = currentSettings.artistSource === MetadataSourceType.MusicBrainz || currentSettings.albumSource === MetadataSourceType.MusicBrainz;
      const needsDeezer = currentSettings.artistSource === MetadataSourceType.Deezer || currentSettings.albumSource === MetadataSourceType.Deezer;

      const hasApple = hasUsableProviderMetadata(meta?.apple, currentSettings, 'apple', now);
      const hasMB = hasUsableProviderMetadata(meta?.musicbrainz, currentSettings, 'musicbrainz', now);
      const hasDeezer = hasUsableProviderMetadata(meta?.deezer, currentSettings, 'deezer', now);

      if (forceFetch || (needsApple && !hasApple) || (needsMB && !hasMB) || (needsDeezer && !hasDeezer)) {
        enqueueRelease(releaseId, forceFetch);
        addedCount++;
      } else {
        processedSessionRef.current.add(releaseId);
      }
    }

    if (addedCount > 0) {
      processQueueRef.current();
      ensureDispatcher();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queuedReleases, settings, isHydrated]);

  return { refreshRelease };
}
