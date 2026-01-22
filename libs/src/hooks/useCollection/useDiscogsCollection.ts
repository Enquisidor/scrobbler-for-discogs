import { useState, useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDiscogsPage, DiscogsAuthError, DiscogsRateLimitError } from '../../services/discogsService';
import type { Credentials } from '../../types';
import type { RootState } from '../../store/index';
import {
  startLoading,
  setInitialCollection,
  syncPageSuccess,
  syncComplete,
  setRateLimitError,
  clearError,
  setAuthError,
  setError,
  resetCollection
} from '../../store/collectionSlice';

const PAGE_SIZE = 50;
// Increased concurrency to 3 to parallelize network latency.
// Delay set to 3100ms per worker prevents hitting the 60 req/min limit (3 reqs / 3.1s ~= 58 req/min).
const MAX_CONCURRENT_FETCHES = 3;
const RATE_LIMIT_PAUSE_MS = 60000;
const REQUEST_DELAY_MS = 3100;

const API_SORT = 'added';
const API_SORT_ORDER = 'desc';

export interface DiscogsCollectionOptions {
  /** Callback to run when force reload is triggered (e.g., to set a flag for metadata refetch) */
  onForceReload?: () => void;
}

export function useDiscogsCollection(
  credentials: Credentials,
  isConnected: boolean,
  options: DiscogsCollectionOptions = {}
) {
  const dispatch = useDispatch();
  const { collection: fullCollection, isLoading, isSyncing, error, isAuthError } = useSelector(
    (state: RootState) => state.collection
  );

  const [reloadTrigger, setReloadTrigger] = useState(0);

  const pagesToFetchRef = useRef<number[]>([]);
  const activeFetchesRef = useRef(0);
  const mountedRef = useRef(true);
  const isRateLimitedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    let aborted = false;

    const worker = async () => {
      while (pagesToFetchRef.current.length > 0) {
        if (aborted) break;

        if (isRateLimitedRef.current) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }

        // Respect rate limits by waiting before each request
        await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY_MS));
        if (aborted) break;

        const page = pagesToFetchRef.current.shift();
        if (typeof page === 'undefined') continue;

        try {
          const data = await fetchDiscogsPage(
            credentials.discogsUsername,
            credentials.discogsAccessToken,
            credentials.discogsAccessTokenSecret,
            page,
            API_SORT,
            API_SORT_ORDER,
            PAGE_SIZE
          );
          if (aborted) break;

          if (mountedRef.current) {
            dispatch(syncPageSuccess(data.releases));
          }
        } catch (err) {
          if (err instanceof DiscogsRateLimitError) {
            if (!isRateLimitedRef.current) {
              isRateLimitedRef.current = true;
              console.warn('Rate limited by Discogs. Pausing all fetches for 60 seconds.');
              if (mountedRef.current) dispatch(setRateLimitError('Discogs rate limit hit. Sync is paused...'));

              pagesToFetchRef.current.unshift(page);

              setTimeout(() => {
                isRateLimitedRef.current = false;
                if (mountedRef.current) dispatch(clearError());
              }, RATE_LIMIT_PAUSE_MS);
            } else {
              pagesToFetchRef.current.unshift(page);
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
          } else if (err instanceof DiscogsAuthError) {
            if (mountedRef.current) dispatch(setAuthError());
            aborted = true;
            break;
          } else if (err instanceof Error) {
            console.error(`Failed to fetch page ${page}:`, err);
            if (mountedRef.current) dispatch(setError('Failed to fetch a page from Discogs. The sync may be incomplete.'));
          }
        }
      }
      activeFetchesRef.current -= 1;
      if (activeFetchesRef.current === 0) {
        if (mountedRef.current) dispatch(syncComplete());
      }
    };

    const startFullCollectionSync = async () => {
      if (!isConnected) {
        dispatch(resetCollection());
        return;
      }

      dispatch(startLoading());
      pagesToFetchRef.current = [];
      activeFetchesRef.current = 0;
      isRateLimitedRef.current = false;

      try {
        const initialData = await fetchDiscogsPage(
          credentials.discogsUsername,
          credentials.discogsAccessToken,
          credentials.discogsAccessTokenSecret,
          1,
          API_SORT,
          API_SORT_ORDER,
          PAGE_SIZE
        );
        if (aborted) return;

        const totalPages = initialData.pagination.pages;

        dispatch(setInitialCollection({ releases: initialData.releases, totalPages }));

        if (totalPages > 1) {
          pagesToFetchRef.current = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);

          const workerCount = Math.min(MAX_CONCURRENT_FETCHES, pagesToFetchRef.current.length);
          activeFetchesRef.current = workerCount;

          for (let i = 0; i < workerCount; i++) {
            worker();
          }
        }
      } catch (err) {
        if (err instanceof DiscogsAuthError) {
          if (mountedRef.current) dispatch(setAuthError());
        } else if (err instanceof Error) {
          console.error('Failed to start collection sync:', err);
          dispatch(setError(err.message));
        }
      }
    };

    startFullCollectionSync();

    return () => {
      mountedRef.current = false;
      aborted = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, credentials.discogsUsername, reloadTrigger]);

  const forceReload = useCallback(() => {
    if (!isConnected) return;
    options.onForceReload?.();
    setReloadTrigger(c => c + 1);
  }, [isConnected, options]);

  return {
    collection: fullCollection,
    isLoading,
    isSyncing,
    error,
    isAuthError,
    forceReload,
  };
}
