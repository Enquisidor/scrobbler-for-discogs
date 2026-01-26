/**
 * Tests for useHydrateStore hook
 */

// Mock AsyncStorage before any imports
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  getAllKeys: jest.fn(),
}));

import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useHydrateStore } from '../useHydrateStore';
import collectionReducer from '../../../store/collectionSlice';
import metadataReducer from '../../../store/metadataSlice';

// Cast mocks for TypeScript
const mockGetItem = AsyncStorage.getItem as jest.Mock;

// Create a fresh store for each test
const createTestStore = () =>
  configureStore({
    reducer: {
      collection: collectionReducer,
      metadata: metadataReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({ serializableCheck: false }),
  });

// Wrapper component with Redux Provider
const createWrapper = (store: ReturnType<typeof createTestStore>) => {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(Provider, { store, children });
  };
};

describe('useHydrateStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should return false initially before hydration completes', () => {
      mockGetItem.mockResolvedValue(null);

      const store = createTestStore();
      const { result } = renderHook(() => useHydrateStore(), {
        wrapper: createWrapper(store),
      });

      expect(result.current).toBe(false);
    });

    it('should return true after hydration completes', async () => {
      mockGetItem.mockResolvedValue(null);

      const store = createTestStore();
      const { result } = renderHook(() => useHydrateStore(), {
        wrapper: createWrapper(store),
      });

      await waitFor(() => {
        expect(result.current).toBe(true);
      });
    });
  });

  describe('Metadata Hydration', () => {
    it('should hydrate metadata from AsyncStorage', async () => {
      const storedMetadata = {
        123: { apple: { artist: 'Test Artist', lastChecked: Date.now() } },
      };
      mockGetItem.mockImplementation((key: string) => {
        if (key === 'scrobbler-for-dscogs-metadata-v2') {
          return Promise.resolve(JSON.stringify(storedMetadata));
        }
        return Promise.resolve(null);
      });

      const store = createTestStore();
      renderHook(() => useHydrateStore(), {
        wrapper: createWrapper(store),
      });

      await waitFor(() => {
        const state = store.getState();
        expect(state.metadata.data[123]).toBeDefined();
        expect(state.metadata.data[123].apple?.artist).toBe('Test Artist');
      });
    });

    it('should handle invalid metadata JSON gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockGetItem.mockImplementation((key: string) => {
        if (key === 'scrobbler-for-dscogs-metadata-v2') {
          return Promise.resolve('invalid json{');
        }
        return Promise.resolve(null);
      });

      const store = createTestStore();
      const { result } = renderHook(() => useHydrateStore(), {
        wrapper: createWrapper(store),
      });

      await waitFor(() => {
        expect(result.current).toBe(true);
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to parse stored metadata:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Collection Hydration', () => {
    it('should hydrate collection from AsyncStorage', async () => {
      const storedCollection = {
        collection: [
          { id: 1, instance_id: 1001, basic_information: { title: 'Album 1' } },
          { id: 2, instance_id: 1002, basic_information: { title: 'Album 2' } },
        ],
        lastSynced: Date.now(),
      };
      mockGetItem.mockImplementation((key: string) => {
        if (key === 'scrobbler-for-dscogs-collection-v1') {
          return Promise.resolve(JSON.stringify(storedCollection));
        }
        return Promise.resolve(null);
      });

      const store = createTestStore();
      renderHook(() => useHydrateStore(), {
        wrapper: createWrapper(store),
      });

      await waitFor(() => {
        const state = store.getState();
        expect(state.collection.collection.length).toBe(2);
        expect(state.collection.isHydrated).toBe(true);
      });
    });

    it('should set hydrated flag when collection is empty', async () => {
      mockGetItem.mockResolvedValue(null);

      const store = createTestStore();
      renderHook(() => useHydrateStore(), {
        wrapper: createWrapper(store),
      });

      await waitFor(() => {
        const state = store.getState();
        expect(state.collection.isHydrated).toBe(true);
        expect(state.collection.collection.length).toBe(0);
      });
    });

    it('should set hydrated flag when stored collection is empty array', async () => {
      const storedCollection = {
        collection: [],
        lastSynced: Date.now(),
      };
      mockGetItem.mockImplementation((key: string) => {
        if (key === 'scrobbler-for-dscogs-collection-v1') {
          return Promise.resolve(JSON.stringify(storedCollection));
        }
        return Promise.resolve(null);
      });

      const store = createTestStore();
      renderHook(() => useHydrateStore(), {
        wrapper: createWrapper(store),
      });

      await waitFor(() => {
        const state = store.getState();
        expect(state.collection.isHydrated).toBe(true);
        expect(state.collection.collection.length).toBe(0);
      });
    });

    it('should handle invalid collection JSON gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockGetItem.mockImplementation((key: string) => {
        if (key === 'scrobbler-for-dscogs-collection-v1') {
          return Promise.resolve('invalid json{');
        }
        return Promise.resolve(null);
      });

      const store = createTestStore();
      const { result } = renderHook(() => useHydrateStore(), {
        wrapper: createWrapper(store),
      });

      await waitFor(() => {
        expect(result.current).toBe(true);
        const state = store.getState();
        expect(state.collection.isHydrated).toBe(true);
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to parse stored collection:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Parallel Loading', () => {
    it('should load metadata and collection in parallel', async () => {
      const storedMetadata = { 1: { apple: { artist: 'Artist' } } };
      const storedCollection = {
        collection: [{ id: 1, instance_id: 1001 }],
        lastSynced: Date.now(),
      };

      mockGetItem.mockImplementation((key: string) => {
        if (key === 'scrobbler-for-dscogs-metadata-v2') {
          return Promise.resolve(JSON.stringify(storedMetadata));
        }
        if (key === 'scrobbler-for-dscogs-collection-v1') {
          return Promise.resolve(JSON.stringify(storedCollection));
        }
        return Promise.resolve(null);
      });

      const store = createTestStore();
      const { result } = renderHook(() => useHydrateStore(), {
        wrapper: createWrapper(store),
      });

      await waitFor(() => {
        expect(result.current).toBe(true);
      });

      const state = store.getState();
      expect(state.metadata.data[1]).toBeDefined();
      expect(state.collection.collection.length).toBe(1);
      expect(state.collection.isHydrated).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle AsyncStorage errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockGetItem.mockRejectedValue(new Error('Storage error'));

      const store = createTestStore();
      const { result } = renderHook(() => useHydrateStore(), {
        wrapper: createWrapper(store),
      });

      await waitFor(() => {
        expect(result.current).toBe(true);
      });

      // Should still set hydrated to true even on error
      const state = store.getState();
      expect(state.collection.isHydrated).toBe(true);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to hydrate store from AsyncStorage:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });
});
