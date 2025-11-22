

import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchDiscogsPage } from '../services/discogsService';
import type { Credentials, DiscogsRelease } from '../types';
import { SortOption } from '../types';
import { formatArtistNames } from './utils/formattingUtils';
import { mergePageIntoCollection } from './utils/collectionSyncUtils';

const getApiSortParams = (option: SortOption): { sort: string, sortOrder: 'asc' | 'desc' } => {
  switch (option) {
    case SortOption.ArtistAZ: return { sort: 'artist', sortOrder: 'asc' };
    case SortOption.ArtistZA: return { sort: 'artist', sortOrder: 'desc' };
    case SortOption.AlbumAZ: return { sort: 'title', sortOrder: 'asc' };
    case SortOption.AlbumZA: return { sort: 'title', sortOrder: 'desc' };
    case SortOption.YearNewest: return { sort: 'year', sortOrder: 'desc' };
    case SortOption.YearOldest: return { sort: 'year', sortOrder: 'asc' };
    case SortOption.AddedNewest: return { sort: 'added', sortOrder: 'desc' };
    case SortOption.AddedOldest: return { sort: 'added', sortOrder: 'asc' };
    case SortOption.FormatAZ: return { sort: 'format', sortOrder: 'asc' };
    case SortOption.FormatZA: return { sort: 'format', sortOrder: 'desc' };
    default: return { sort: 'added', sortOrder: 'desc' };
  }
};

export function useDiscogsCollection(
    credentials: Credentials, 
    isConnected: boolean,
    sortOption: SortOption
) {
  const [collection, setCollection] = useState<DiscogsRelease[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [nextPage, setNextPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const hasMore = nextPage <= totalPages;
  const [reloadTrigger, setReloadTrigger] = useState(0);
  
  const isFetchingRef = useRef(false);
  const mountedRef = useRef(true);

  const cacheKey = `vinyl-scrobbler-collection-${credentials.discogsUsername}`;

  const fetchInitialPages = async (sort: string, sortOrder: 'asc' | 'desc', ignoreCache: boolean = false) => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;
      if (mountedRef.current) setIsSyncing(true);

      try {
          if (!ignoreCache && sort === 'added' && sortOrder === 'desc') {
              try {
                  const cachedDataRaw = localStorage.getItem(cacheKey);
                  if (cachedDataRaw) {
                      const parsedReleases: DiscogsRelease[] = JSON.parse(cachedDataRaw);
                      const formattedCached = parsedReleases.map(release => {
                          if (release.basic_information?.artists) {
                              const displayName = formatArtistNames(release.basic_information.artists) || 'Unknown Artist';
                              if (displayName !== release.basic_information.artist_display_name) {
                                  return { ...release, basic_information: { ...release.basic_information, artist_display_name: displayName } };
                              }
                          }
                          return release;
                      });
                      if (mountedRef.current) setCollection(formattedCached);
                  }
              } catch (e) { console.error("Failed to read cache.", e); } 
              finally { if (mountedRef.current) setIsLoading(false); }
          } else {
               if (mountedRef.current && collection.length === 0) setIsLoading(true); 
          }

          const p1 = await fetchDiscogsPage(credentials.discogsUsername, credentials.discogsAccessToken, credentials.discogsAccessTokenSecret, 1, sort, sortOrder);
          if (!mountedRef.current) return;
          
          setTotalPages(p1.pagination.pages);
          
          setCollection(prev => {
              const { merged, hasChanges } = mergePageIntoCollection(prev, p1.releases);
              if (hasChanges && sort === 'added' && sortOrder === 'desc') {
                  localStorage.setItem(cacheKey, JSON.stringify(merged));
              }
              return merged;
          });

          if (mountedRef.current) setIsLoading(false);

          let currentNextPage = 2;

          if (p1.pagination.pages >= 2) {
              const p2 = await fetchDiscogsPage(credentials.discogsUsername, credentials.discogsAccessToken, credentials.discogsAccessTokenSecret, 2, sort, sortOrder);
              if (mountedRef.current) {
                  setCollection(prev => {
                      const { merged, hasChanges } = mergePageIntoCollection(prev, p2.releases);
                      if (hasChanges && sort === 'added' && sortOrder === 'desc') localStorage.setItem(cacheKey, JSON.stringify(merged));
                      return merged;
                  });
                  currentNextPage = 3;
              }
          }

          if (p1.pagination.pages >= 3) {
              const p3 = await fetchDiscogsPage(credentials.discogsUsername, credentials.discogsAccessToken, credentials.discogsAccessTokenSecret, 3, sort, sortOrder);
              if (mountedRef.current) {
                  setCollection(prev => {
                      const { merged, hasChanges } = mergePageIntoCollection(prev, p3.releases);
                      if (hasChanges && sort === 'added' && sortOrder === 'desc') localStorage.setItem(cacheKey, JSON.stringify(merged));
                      return merged;
                  });
                  currentNextPage = 4;
              }
          }

          if (mountedRef.current) setNextPage(currentNextPage);

      } catch (err) {
          console.error(err);
          if (mountedRef.current) setError(err instanceof Error ? err.message : 'An error occurred while fetching collection.');
      } finally {
          isFetchingRef.current = false;
          if (mountedRef.current) {
              setIsSyncing(false);
              setIsLoading(false);
          }
      }
  };

  useEffect(() => {
    mountedRef.current = true;
    if (!isConnected) {
      setIsLoading(false);
      setCollection([]);
      return;
    }
    
    const { sort, sortOrder } = getApiSortParams(sortOption);
    
    if (sortOption !== SortOption.AddedNewest || reloadTrigger > 0) {
         setNextPage(1);
    } 

    const ignoreCache = sortOption !== SortOption.AddedNewest || reloadTrigger > 0;
    
    fetchInitialPages(sort, sortOrder, ignoreCache);
    
    return () => { mountedRef.current = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, credentials.discogsUsername, sortOption, reloadTrigger]);


  const fetchNextPage = useCallback(async () => {
      if (isFetchingRef.current || !hasMore) return;
      
      try {
        isFetchingRef.current = true;
        setIsSyncing(true);
        
        const { sort, sortOrder } = getApiSortParams(sortOption);

        const { releases: freshReleases, pagination } = await fetchDiscogsPage(
          credentials.discogsUsername,
          credentials.discogsAccessToken,
          credentials.discogsAccessTokenSecret,
          nextPage,
          sort,
          sortOrder
        );
        
        if (!mountedRef.current) return;

        setTotalPages(pagination.pages);
        setNextPage(prev => prev + 1);

        setCollection(prevCollection => {
            const { merged, hasChanges } = mergePageIntoCollection(prevCollection, freshReleases);
            if (hasChanges && sort === 'added' && sortOrder === 'desc') {
                localStorage.setItem(cacheKey, JSON.stringify(merged));
            }
            return merged;
        });

      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'An error occurred while fetching collection.');
      } finally {
        isFetchingRef.current = false;
        if (mountedRef.current) setIsSyncing(false);
      }
  }, [credentials, nextPage, hasMore, cacheKey, sortOption]);

  const forceReload = useCallback(() => {
    if (!isConnected) return;
    
    sessionStorage.setItem('force-metadata-fetch', 'true');

    setCollection([]);
    setNextPage(1);
    setTotalPages(1);
    setError(null);
    localStorage.removeItem(cacheKey);

    setReloadTrigger(c => c + 1);
  }, [isConnected, cacheKey]);

  return { 
      collection, 
      isLoading, 
      isSyncing, 
      hasMore, 
      loadMore: fetchNextPage,
      error, 
      setError,
      forceReload,
  };
} 