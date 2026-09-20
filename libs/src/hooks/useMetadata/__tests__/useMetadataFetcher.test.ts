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
  date_added: new Date().toISOString(),
  basic_information: {
    artist_display_name: 'Test Name',
    title: `Album ${id}`,
    year: 2020,
    thumb: '',
    cover_image: '',
    artists: [{ name: 'Test Artist', id: 1, join: '', anv: '', resource_url: '' }],
    labels: [],
    formats: [],
  },
});

const defaultSettings: Settings = {
  selectAllTracksPerRelease: true,
  selectSubtracksByDefault: true,
  showFeatures: true,
  showCredits: true,
  hideAlbumNames: false,
  darkMode: true,
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
    return React.createElement(Provider, { store, children });
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
      const queued = [createRelease(1), createRelease(2)];

      renderHook(() => useMetadataFetcher(queued, defaultSettings), {
        wrapper: createWrapper(store),
      });

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(mockFetchApple).not.toHaveBeenCalled();
      expect(mockFetchMB).not.toHaveBeenCalled();
    });
  });

  describe('When Apple Music is selected', () => {
    it('should fetch Apple Music metadata for queued albums', async () => {
      mockFetchApple.mockResolvedValue({
        artist: 'Apple Artist',
        album: 'Apple Album',
        rawItunesResult: {},
      });

      const store = createTestStore();
      const queued = [createRelease(1)];

      renderHook(() => useMetadataFetcher(queued, appleSettings), {
        wrapper: createWrapper(store),
      });

      await act(async () => {
        jest.advanceTimersByTime(1000);
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(mockFetchApple).toHaveBeenCalled();
      });
    });

    it('should not fetch when the queue is empty', async () => {
      mockFetchApple.mockResolvedValue({ artist: 'Apple Artist', rawItunesResult: {} });

      const store = createTestStore();

      renderHook(() => useMetadataFetcher([], appleSettings), {
        wrapper: createWrapper(store),
      });

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      expect(mockFetchApple).not.toHaveBeenCalled();
    });

    it('should not fetch Apple metadata if already cached and recent', async () => {
      const recentTimestamp = Date.now();
      const store = createTestStore({
        1: { apple: { artist: 'Cached', album: 'Cached Album', lastChecked: recentTimestamp } },
      });
      const queued = [createRelease(1)];

      renderHook(() => useMetadataFetcher(queued, appleSettings), {
        wrapper: createWrapper(store),
      });

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(mockFetchApple).not.toHaveBeenCalled();
    });

    it('should only fetch each release id once when queued multiple times', async () => {
      mockFetchApple.mockResolvedValue({
        artist: 'Apple Artist',
        rawItunesResult: {},
      });

      const store = createTestStore();
      const release = createRelease(1);
      const queued = [release, { ...release, instance_id: 9999 }];

      renderHook(() => useMetadataFetcher(queued, appleSettings), {
        wrapper: createWrapper(store),
      });

      await act(async () => {
        jest.advanceTimersByTime(1000);
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(mockFetchApple).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('When MusicBrainz is selected', () => {
    it('should fetch MusicBrainz metadata for queued albums', async () => {
      mockFetchMB.mockResolvedValue({
        artist: 'MB Artist',
        album: 'MB Album',
        lastChecked: Date.now(),
      });

      const store = createTestStore();
      const queued = [createRelease(1)];

      renderHook(() => useMetadataFetcher(queued, mbSettings), {
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

  describe('Hydration check', () => {
    it('should not fetch until store is hydrated', async () => {
      mockFetchApple.mockResolvedValue({ artist: 'Test' });

      const store = configureStore({
        reducer: { metadata: metadataReducer },
        preloadedState: {
          metadata: { data: {}, isHydrated: false },
        },
      });

      const queued = [createRelease(1)];

      renderHook(() => useMetadataFetcher(queued, appleSettings), {
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
      const queued = [createRelease(1)];

      renderHook(
        () => useMetadataFetcher(queued, appleSettings, {
          checkForceFetch,
          clearForceFetch,
        }),
        { wrapper: createWrapper(store) }
      );

      await act(async () => {
        jest.advanceTimersByTime(1000);
        await Promise.resolve();
      });

      expect(checkForceFetch).toHaveBeenCalled();
    });

    it('should call clearForceFetch when force fetch is true', async () => {
      mockFetchApple.mockResolvedValue({ artist: 'Test', rawItunesResult: {} });

      const checkForceFetch = jest.fn(() => true);
      const clearForceFetch = jest.fn();

      const store = createTestStore();
      const queued = [createRelease(1)];

      renderHook(
        () => useMetadataFetcher(queued, appleSettings, {
          checkForceFetch,
          clearForceFetch,
        }),
        { wrapper: createWrapper(store) }
      );

      await act(async () => {
        jest.advanceTimersByTime(1000);
        await Promise.resolve();
      });

      expect(clearForceFetch).toHaveBeenCalled();
    });
  });

  describe('refreshRelease', () => {
    it('should force refetch a queued release that already has cached metadata', async () => {
      mockFetchApple.mockResolvedValue({
        artist: 'Refetched Artist',
        album: 'Refetched Album',
        rawItunesResult: {},
      });

      const recentTimestamp = Date.now();
      const store = createTestStore({
        1: { apple: { artist: 'Cached', album: 'Cached Album', lastChecked: recentTimestamp } },
      });
      const queued = [createRelease(1)];

      const { result } = renderHook(() => useMetadataFetcher(queued, appleSettings), {
        wrapper: createWrapper(store),
      });

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(mockFetchApple).not.toHaveBeenCalled();

      await act(async () => {
        result.current.refreshRelease(1);
        jest.advanceTimersByTime(1000);
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(mockFetchApple).toHaveBeenCalledTimes(1);
      });
    });
  });
});
