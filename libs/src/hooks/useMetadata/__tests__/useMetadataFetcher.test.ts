/**
 * Tests for useMetadataFetcher hook
 */
import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { enableMapSet } from 'immer';
import { useMetadataFetcher } from '../useMetadataFetcher';
import metadataReducer from '../../../store/metadataSlice';
import type { DiscogsRelease, Settings } from '../../../types';
import { MetadataSourceType } from '../../../types';

// Enable MapSet for tests
enableMapSet();

// Mock the services
jest.mock('../../../services/appleMusic/appleMusicService', () => ({
  fetchAppleMusicMetadata: jest.fn(),
}));

jest.mock('../../../services/musicbrainz/musicbrainzService', () => ({
  fetchMusicBrainzMetadata: jest.fn(),
}));

import { fetchAppleMusicMetadata } from '../../../services/appleMusic/appleMusicService';
import { fetchMusicBrainzMetadata } from '../../../services/musicbrainz/musicbrainzService';

const mockFetchApple = fetchAppleMusicMetadata as jest.Mock;
const mockFetchMB = fetchMusicBrainzMetadata as jest.Mock;

// Sample test data
const createRelease = (id: number): DiscogsRelease => ({
  id,
  instance_id: id * 1000,
  rating: 0,
  basic_information: {
    id,
    title: `Album ${id}`,
    year: 2020,
    thumb: '',
    cover_image: '',
    resource_url: '',
    artists: [{ name: 'Test Artist', id: 1, join: '', anv: '', tracks: '', role: '', resource_url: '' }],
    labels: [],
    genres: [],
    styles: [],
    formats: [],
  },
});

const defaultSettings: Settings = {
  selectAllTracksPerRelease: true,
  selectSubtracksByDefault: true,
  showFeatures: true,
  selectFeaturesByDefault: false,
  artistSource: MetadataSourceType.Discogs,
  albumSource: MetadataSourceType.Discogs,
};

const appleSettings: Settings = {
  ...defaultSettings,
  artistSource: MetadataSourceType.Apple,
  albumSource: MetadataSourceType.Apple,
};

const mbSettings: Settings = {
  ...defaultSettings,
  artistSource: MetadataSourceType.MusicBrainz,
  albumSource: MetadataSourceType.MusicBrainz,
};

// Create a fresh store for each test with hydrated state
const createTestStore = (initialMetadata: Record<number, any> = {}) =>
  configureStore({
    reducer: {
      metadata: metadataReducer,
    },
    preloadedState: {
      metadata: {
        data: initialMetadata,
        isHydrated: true, // Important: hook won't fetch until hydrated
      },
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({ serializableCheck: false }),
  });

// Wrapper component with Redux Provider
const createWrapper = (store: ReturnType<typeof createTestStore>) => {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(Provider, { store }, children);
  };
};

describe('useMetadataFetcher', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('When Discogs is selected (no external fetching)', () => {
    it('should not fetch any metadata when both sources are Discogs', async () => {
      const store = createTestStore();
      const collection = [createRelease(1), createRelease(2)];

      renderHook(() => useMetadataFetcher(collection, defaultSettings), {
        wrapper: createWrapper(store),
      });

      // Advance timers
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(mockFetchApple).not.toHaveBeenCalled();
      expect(mockFetchMB).not.toHaveBeenCalled();
    });
  });

  describe('When Apple Music is selected', () => {
    it('should fetch Apple Music metadata for items in collection', async () => {
      mockFetchApple.mockResolvedValue({
        artist: 'Apple Artist',
        album: 'Apple Album',
        rawItunesResult: {},
      });

      const store = createTestStore();
      const collection = [createRelease(1)];

      renderHook(() => useMetadataFetcher(collection, appleSettings), {
        wrapper: createWrapper(store),
      });

      // Advance through the dispatcher interval
      await act(async () => {
        jest.advanceTimersByTime(1000);
        await Promise.resolve(); // Allow promises to resolve
      });

      await waitFor(() => {
        expect(mockFetchApple).toHaveBeenCalled();
      });
    });

    it('should not fetch Apple metadata if already cached and recent', async () => {
      const recentTimestamp = Date.now();
      const store = createTestStore({
        1: { apple: { artist: 'Cached', lastChecked: recentTimestamp } },
      });
      const collection = [createRelease(1)];

      renderHook(() => useMetadataFetcher(collection, appleSettings), {
        wrapper: createWrapper(store),
      });

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(mockFetchApple).not.toHaveBeenCalled();
    });
  });

  describe('When MusicBrainz is selected', () => {
    it('should fetch MusicBrainz metadata for items in collection', async () => {
      mockFetchMB.mockResolvedValue({
        artist: 'MB Artist',
        album: 'MB Album',
        lastChecked: Date.now(),
      });

      const store = createTestStore();
      const collection = [createRelease(1)];

      renderHook(() => useMetadataFetcher(collection, mbSettings), {
        wrapper: createWrapper(store),
      });

      await act(async () => {
        jest.advanceTimersByTime(1000);
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(mockFetchMB).toHaveBeenCalled();
      });
    });
  });

  describe('visibleIds filtering', () => {
    it('should only fetch metadata for visible items when visibleIds is provided', async () => {
      mockFetchApple.mockResolvedValue({
        artist: 'Apple Artist',
        rawItunesResult: {},
      });

      const store = createTestStore();
      const collection = [createRelease(1), createRelease(2), createRelease(3)];
      const visibleIds = new Set([2]); // Only item 2 is visible

      renderHook(
        () => useMetadataFetcher(collection, appleSettings, { visibleIds }),
        { wrapper: createWrapper(store) }
      );

      await act(async () => {
        jest.advanceTimersByTime(1000);
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(mockFetchApple).toHaveBeenCalledTimes(1);
      });

      // Verify it was called with release id 2
      expect(mockFetchApple).toHaveBeenCalledWith(
        expect.objectContaining({ id: 2 }),
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('should fetch all items when visibleIds is empty (fallback behavior)', async () => {
      mockFetchApple.mockResolvedValue({
        artist: 'Apple Artist',
        rawItunesResult: {},
      });

      const store = createTestStore();
      const collection = [createRelease(1), createRelease(2)];
      const visibleIds = new Set<number>(); // Empty set

      renderHook(
        () => useMetadataFetcher(collection, appleSettings, { visibleIds }),
        { wrapper: createWrapper(store) }
      );

      await act(async () => {
        jest.advanceTimersByTime(2000);
        await Promise.resolve();
      });

      // With empty visibleIds, it should fetch all
      await waitFor(() => {
        expect(mockFetchApple.mock.calls.length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe('Hydration check', () => {
    it('should not fetch until store is hydrated', async () => {
      mockFetchApple.mockResolvedValue({ artist: 'Test' });

      // Create store with isHydrated = false
      const store = configureStore({
        reducer: { metadata: metadataReducer },
        preloadedState: {
          metadata: { data: {}, isHydrated: false },
        },
      });

      const collection = [createRelease(1)];

      renderHook(() => useMetadataFetcher(collection, appleSettings), {
        wrapper: createWrapper(store),
      });

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      expect(mockFetchApple).not.toHaveBeenCalled();
    });
  });

  describe('Force fetch', () => {
    it('should call checkForceFetch on each effect run', async () => {
      mockFetchApple.mockResolvedValue({ artist: 'Test', rawItunesResult: {} });

      const checkForceFetch = jest.fn(() => false);
      const clearForceFetch = jest.fn();

      const store = createTestStore();
      const collection = [createRelease(1)];

      renderHook(
        () => useMetadataFetcher(collection, appleSettings, {
          checkForceFetch,
          clearForceFetch,
        }),
        { wrapper: createWrapper(store) }
      );

      await act(async () => {
        jest.advanceTimersByTime(1000);
        await Promise.resolve();
      });

      // checkForceFetch should be called when the effect runs
      expect(checkForceFetch).toHaveBeenCalled();
    });

    it('should call clearForceFetch when force fetch is true', async () => {
      mockFetchApple.mockResolvedValue({ artist: 'Test', rawItunesResult: {} });

      const checkForceFetch = jest.fn(() => true); // Force fetch is requested
      const clearForceFetch = jest.fn();

      const store = createTestStore();
      const collection = [createRelease(1)];

      renderHook(
        () => useMetadataFetcher(collection, appleSettings, {
          checkForceFetch,
          clearForceFetch,
        }),
        { wrapper: createWrapper(store) }
      );

      await act(async () => {
        jest.advanceTimersByTime(1000);
        await Promise.resolve();
      });

      // clearForceFetch should be called when checkForceFetch returns true
      expect(clearForceFetch).toHaveBeenCalled();
    });
  });
});
