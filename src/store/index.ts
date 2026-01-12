
import { configureStore } from '@reduxjs/toolkit';
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
  devTools: true, // Explicitly enable DevTools
});

store.subscribe(() => {
  const state = store.getState();
  try {
    localStorage.setItem('vinyl-scrobbler-metadata-v2', JSON.stringify(state.metadata.data));
  } catch (error) {
    console.error('Failed to save metadata to local storage:', error);
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
