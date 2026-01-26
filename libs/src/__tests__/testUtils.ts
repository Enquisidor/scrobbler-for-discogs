/**
 * Mobile test utilities
 *
 * Re-exports shared fixtures from libs and adds mobile-specific helpers
 */
import { enableMapSet } from 'immer';

// Enable Immer MapSet plugin (needed for trackSelectionSlice which uses Set)
enableMapSet();

// Re-export all shared fixtures from libs
export {
  defaultSettings,
  customSettings,
  emptyCredentials,
  connectedCredentials,
  createMockRelease,
  createMockReleaseWithTracks,
  createMockQueueItem,
  createMockQueueItemWithTracks,
  createMockQueueItemWithSubtracks,
  createMockQueueItemWithFeatures,
  createMockCollectionResponse,
  createMockFetch,
  waitForCondition,
} from './fixtures';

// ==================== Redux Test Helpers ====================
// Mobile-specific: uses local store slices

export const createTestStore = () => {
  // Lazy import to avoid circular dependencies
  const { configureStore } = require('@reduxjs/toolkit');
  const collectionReducer = require('../store/collectionSlice').default;
  const queueReducer = require('../store/queueSlice').default;
  const trackSelectionReducer = require('../store/trackSelectionSlice').default;
  const metadataReducer = require('../store/metadataSlice').default;

  return configureStore({
    reducer: {
      collection: collectionReducer,
      queue: queueReducer,
      trackSelection: trackSelectionReducer,
      metadata: metadataReducer,
    },
    middleware: (getDefaultMiddleware: any) =>
      getDefaultMiddleware({
        serializableCheck: false, // Disable for Set objects in trackSelection
      }),
  });
};
