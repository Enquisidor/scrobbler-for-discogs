
import { useState, useEffect, useRef } from 'react';
import { fetchDiscogsCollection } from '../services/discogsService';
import { fetchOfficialArtistName } from '../services/musicbrainzService';
import type { Credentials, DiscogsRelease } from '../types';

export function useDiscogsCollection(credentials: Credentials, isConnected: boolean) {
  const [collection, setCollection] = useState<DiscogsRelease[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const isFetchingMbNames = useRef(false);

  useEffect(() => {
    if (!isConnected) {
      setIsLoading(false);
      setCollection([]);
      return;
    }

    const fetchAndCacheMbNames = async (releases: DiscogsRelease[]) => {
      if (isFetchingMbNames.current || !releases || releases.length === 0) return;
      isFetchingMbNames.current = true;
      
      const mbCacheKeyPrefix = `mb-artist-`;
      
      for (const release of releases) {
        const cacheKey = `${mbCacheKeyPrefix}${release.id}`;
        const cachedName = localStorage.getItem(cacheKey);

        let officialName: string | null;

        if (cachedName !== null) {
          officialName = cachedName === 'null' ? null : cachedName;
        } else {
          const discogsArtistName = release.basic_information.artist_display_name;
          officialName = await fetchOfficialArtistName(release.basic_information.title, discogsArtistName);
          localStorage.setItem(cacheKey, officialName === null ? 'null' : (officialName || 'null'));
        }

        if (officialName) {
          setCollection(prev => prev.map(r => r.id === release.id ? {
              ...r,
              basic_information: {
                  ...r.basic_information,
                  artist_display_name: officialName as string,
              }
          } : r));
        }
      }
      
      setCollection(currentCollection => {
        const mainCacheKey = `vinyl-scrobbler-collection-${credentials.discogsUsername}`;
        const existingDataRaw = localStorage.getItem(mainCacheKey);
        if (existingDataRaw) {
            const existingData = JSON.parse(existingDataRaw);
            if (existingData.length === currentCollection.length) {
                 localStorage.setItem(mainCacheKey, JSON.stringify(currentCollection));
            }
        }
        return currentCollection;
      });

      isFetchingMbNames.current = false;
    };

    const loadCollection = async () => {
      setError(null);
      const cacheKey = `vinyl-scrobbler-collection-${credentials.discogsUsername}`;
      let definitiveCollection: DiscogsRelease[] | null = null;
      let cachedReleases: DiscogsRelease[] | null = null;

      // 1. Load from cache for initial display
      try {
        const cachedDataRaw = localStorage.getItem(cacheKey);
        if (cachedDataRaw) {
          let releases: DiscogsRelease[] = JSON.parse(cachedDataRaw);
          releases = releases.map(release => {
            if (release.basic_information && typeof release.basic_information.artist_display_name !== 'string') {
              const displayName = release.basic_information.artists?.map(a => a.name.replace(/\s\(\d+\)$/, '').trim()).join(', ') || 'Unknown Artist';
              return { ...release, basic_information: { ...release.basic_information, artist_display_name: displayName }};
            }
            return release;
          });
          cachedReleases = releases;
          setCollection(cachedReleases);
        }
      } catch (e) {
        console.error("Failed to read cache.", e);
        localStorage.removeItem(cacheKey);
      } finally {
        setIsLoading(false);
      }
      
      // 2. Sync with Discogs
      try {
        if (!cachedReleases) setIsLoading(true); else setIsSyncing(true);

        const onProgress = (current: number, total: number) => {
          if (!cachedReleases) setLoadingProgress({ current, total });
        };

        const freshReleases = await fetchDiscogsCollection(
          credentials.discogsUsername,
          credentials.discogsAccessToken,
          credentials.discogsAccessTokenSecret,
          onProgress
        );
        
        // 3. Compare and set definitive collection
        const needsUpdate = !cachedReleases || freshReleases.length !== cachedReleases.length || 
                          freshReleases.map(r => r.instance_id).sort().join(',') !== 
                          cachedReleases.map(r => r.instance_id).sort().join(',');

        if (needsUpdate) {
          setCollection(freshReleases);
          localStorage.setItem(cacheKey, JSON.stringify(freshReleases));
          definitiveCollection = freshReleases;
        } else {
          definitiveCollection = cachedReleases;
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred while syncing.');
        definitiveCollection = cachedReleases || [];
      } finally {
        setIsLoading(false);
        setIsSyncing(false);
      }

      // 4. Fetch MB names on definitive collection
      if (definitiveCollection && definitiveCollection.length > 0) {
        await fetchAndCacheMbNames(definitiveCollection);
      }
    };

    loadCollection();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, credentials.discogsUsername, credentials.discogsAccessToken, credentials.discogsAccessTokenSecret]);

  return { collection, isLoading, isSyncing, loadingProgress, error, setError };
}