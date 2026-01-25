import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { hydrateMetadata } from '../store/metadataSlice';
import { hydrateCollection, setHydrated } from '../store/collectionSlice';

const METADATA_STORAGE_KEY = 'vinyl-scrobbler-metadata-v2';
const COLLECTION_STORAGE_KEY = 'vinyl-scrobbler-collection-v1';

/**
 * Hook to hydrate Redux store from AsyncStorage on app startup.
 * Call this once at the app root level.
 * Returns isHydrated boolean to know when data is ready.
 */
export function useHydrateStore() {
  const dispatch = useDispatch();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const hydrate = async () => {
      try {
        // Load metadata and collection in parallel
        const [metadataJson, collectionJson] = await Promise.all([
          AsyncStorage.getItem(METADATA_STORAGE_KEY),
          AsyncStorage.getItem(COLLECTION_STORAGE_KEY),
        ]);

        // Hydrate metadata
        if (metadataJson) {
          try {
            const data = JSON.parse(metadataJson);
            dispatch(hydrateMetadata({ data }));
          } catch (e) {
            console.error('Failed to parse stored metadata:', e);
          }
        }

        // Hydrate collection
        if (collectionJson) {
          try {
            const { collection, lastSynced } = JSON.parse(collectionJson);
            if (collection && Array.isArray(collection) && collection.length > 0) {
              dispatch(hydrateCollection({ collection, lastSynced }));
            } else {
              dispatch(setHydrated());
            }
          } catch (e) {
            console.error('Failed to parse stored collection:', e);
            dispatch(setHydrated());
          }
        } else {
          dispatch(setHydrated());
        }
      } catch (error) {
        console.error('Failed to hydrate store from AsyncStorage:', error);
        dispatch(setHydrated());
      } finally {
        setIsHydrated(true);
      }
    };

    hydrate();
  }, [dispatch]);

  return isHydrated;
}
