
import { configureStore } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import collectionReducer from './collectionSlice';
import queueReducer from './queueSlice';
import trackSelectionReducer from './trackSelectionSlice';
import metadataReducer from './metadataSlice';
import { enableMapSet } from 'immer';

// Ensure Map/Set support in Immer is enabled immediately
enableMapSet();

export const store = configureStore({
  reducer: {
    collection: collectionReducer,
    queue: queueReducer,
    trackSelection: trackSelectionReducer,
    metadata: metadataReducer,
  },
  // Disable serializable check for Set/Map usage in state
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
  // React Native doesn't have Redux DevTools, but we can use Reactotron
  devTools: false,
});

// Debounced save to AsyncStorage
let saveTimeout: NodeJS.Timeout | null = null;
let lastCollectionLength = 0;

store.subscribe(() => {
  const state = store.getState();

  // Debounce saves to avoid excessive writes
  if (saveTimeout) clearTimeout(saveTimeout);

  saveTimeout = setTimeout(async () => {
    try {
      // Save metadata
      await AsyncStorage.setItem(
        'scrobbler-for-discogs-metadata-v2',
        JSON.stringify(state.metadata.data)
      );

      // During a background resync, skip saves — we'll write atomically when it completes.
      // During initial load or normal state, save whenever the collection grows.
      const currentCollectionLength = state.collection.collection.length;
      if (
        !state.collection.isBackgroundResyncing &&
        currentCollectionLength > 0 &&
        currentCollectionLength !== lastCollectionLength
      ) {
        lastCollectionLength = currentCollectionLength;
        await AsyncStorage.setItem(
          'scrobbler-for-discogs-collection-v1',
          JSON.stringify({
            collection: state.collection.collection,
            lastSynced: Date.now(),
          })
        );
      }
    } catch (error) {
      console.error('Failed to save to AsyncStorage:', error);
    }
  }, 1000); // Save 1 second after last change
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
