/**
 * Tests for useQueue hook
 *
 * Covers:
 * - Adding albums to queue
 * - Removing albums from queue
 * - Scrobbling functionality
 * - Queue state management
 */
import { renderHook, act, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Provider } from 'react-redux';
import { useQueue } from '../useQueue';
import {
  createTestStore,
  createMockRelease,
  createMockQueueItemWithTracks,
  connectedCredentials,
  defaultSettings,
} from '../../__tests__/testUtils';
import type { DiscogsRelease } from '@libs';

// Mock the services
jest.mock('../../services/discogsService', () => ({
  fetchReleaseTracklist: jest.fn(),
}));

jest.mock('../../services/lastfmService', () => ({
  scrobbleTracks: jest.fn(),
}));

import { fetchReleaseTracklist } from '../../services/discogsService';
import { scrobbleTracks } from '../../services/lastfmService';

const mockFetchReleaseTracklist = fetchReleaseTracklist as jest.Mock;
const mockScrobbleTracks = scrobbleTracks as jest.Mock;

// Wrapper component for providing Redux store
const createWrapper = (store: ReturnType<typeof createTestStore>) => {
  return ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
};

describe('useQueue', () => {
  let store: ReturnType<typeof createTestStore>;
  let mockOnQueueSuccess: jest.Mock;

  beforeEach(() => {
    store = createTestStore();
    mockOnQueueSuccess = jest.fn();
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should return empty queue initially', () => {
      const { result } = renderHook(
        () => useQueue(connectedCredentials, defaultSettings, mockOnQueueSuccess),
        { wrapper: createWrapper(store) }
      );

      expect(result.current.queue).toEqual([]);
      expect(result.current.scrobbledHistory).toEqual([]);
      expect(result.current.isScrobbling).toBe(false);
      expect(result.current.scrobbleError).toBeNull();
    });
  });

  describe('addAlbumToQueue', () => {
    it('should add an album to the queue and fetch tracklist', async () => {
      const release = createMockRelease();
      const tracklist = [
        { position: '1', title: 'Track 1', duration: '3:00', type_: 'track' },
        { position: '2', title: 'Track 2', duration: '4:00', type_: 'track' },
      ];

      mockFetchReleaseTracklist.mockResolvedValue({
        ...release,
        tracklist,
        identifiers: [],
      });

      const { result } = renderHook(
        () => useQueue(connectedCredentials, defaultSettings, mockOnQueueSuccess),
        { wrapper: createWrapper(store) }
      );

      await act(async () => {
        await result.current.addAlbumToQueue(release);
      });

      await waitFor(() => {
        expect(result.current.queue.length).toBe(1);
        expect(result.current.queue[0].tracklist).toEqual(tracklist);
        expect(result.current.queue[0].isLoading).toBe(false);
      });

      expect(mockFetchReleaseTracklist).toHaveBeenCalledWith(
        release.id,
        connectedCredentials.discogsAccessToken,
        connectedCredentials.discogsAccessTokenSecret
      );
    });

    it('should handle fetch error gracefully', async () => {
      const release = createMockRelease();
      mockFetchReleaseTracklist.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(
        () => useQueue(connectedCredentials, defaultSettings, mockOnQueueSuccess),
        { wrapper: createWrapper(store) }
      );

      await act(async () => {
        await result.current.addAlbumToQueue(release);
      });

      await waitFor(() => {
        expect(result.current.queue.length).toBe(1);
        expect(result.current.queue[0].isLoading).toBe(false);
        expect(result.current.queue[0].error).toBe('Network error');
      });
    });
  });

  describe('removeLastInstanceOfAlbumFromQueue', () => {
    it('should remove the last instance of an album from the queue', async () => {
      const release = createMockRelease({ id: 123 });
      const tracklist = [{ position: '1', title: 'Track 1', duration: '3:00', type_: 'track' }];

      mockFetchReleaseTracklist.mockResolvedValue({
        ...release,
        tracklist,
        identifiers: [],
      });

      const { result } = renderHook(
        () => useQueue(connectedCredentials, defaultSettings, mockOnQueueSuccess),
        { wrapper: createWrapper(store) }
      );

      // Add the same album twice
      await act(async () => {
        await result.current.addAlbumToQueue(release);
      });
      await act(async () => {
        await result.current.addAlbumToQueue(release);
      });

      await waitFor(() => {
        expect(result.current.queue.length).toBe(2);
      });

      act(() => {
        result.current.removeLastInstanceOfAlbumFromQueue(123);
      });

      expect(result.current.queue.length).toBe(1);
    });
  });

  describe('removeAllInstancesOfAlbumFromQueue', () => {
    it('should remove all instances of an album from the queue', async () => {
      const release = createMockRelease({ id: 456 });
      const tracklist = [{ position: '1', title: 'Track 1', duration: '3:00', type_: 'track' }];

      mockFetchReleaseTracklist.mockResolvedValue({
        ...release,
        tracklist,
        identifiers: [],
      });

      const { result } = renderHook(
        () => useQueue(connectedCredentials, defaultSettings, mockOnQueueSuccess),
        { wrapper: createWrapper(store) }
      );

      // Add the same album three times
      await act(async () => {
        await result.current.addAlbumToQueue(release);
      });
      await act(async () => {
        await result.current.addAlbumToQueue(release);
      });
      await act(async () => {
        await result.current.addAlbumToQueue(release);
      });

      await waitFor(() => {
        expect(result.current.queue.length).toBe(3);
      });

      act(() => {
        result.current.removeAllInstancesOfAlbumFromQueue(456);
      });

      expect(result.current.queue.length).toBe(0);
    });
  });

  describe('removeAlbumInstanceFromQueue', () => {
    it('should remove a specific instance from the queue', async () => {
      const release1 = createMockRelease({ id: 111 });
      const release2 = createMockRelease({ id: 222 });
      const tracklist = [{ position: '1', title: 'Track 1', duration: '3:00', type_: 'track' }];

      mockFetchReleaseTracklist.mockResolvedValue({
        tracklist,
        identifiers: [],
      });

      const { result } = renderHook(
        () => useQueue(connectedCredentials, defaultSettings, mockOnQueueSuccess),
        { wrapper: createWrapper(store) }
      );

      await act(async () => {
        await result.current.addAlbumToQueue(release1);
      });
      await act(async () => {
        await result.current.addAlbumToQueue(release2);
      });

      await waitFor(() => {
        expect(result.current.queue.length).toBe(2);
      });

      const instanceKeyToRemove = result.current.queue[0].instanceKey;

      act(() => {
        result.current.removeAlbumInstanceFromQueue(instanceKeyToRemove);
      });

      expect(result.current.queue.length).toBe(1);
      expect(result.current.queue[0].instanceKey).not.toBe(instanceKeyToRemove);
    });
  });

  describe('scrobbleTimeOffset', () => {
    it('should update scrobble time offset', () => {
      const { result } = renderHook(
        () => useQueue(connectedCredentials, defaultSettings, mockOnQueueSuccess),
        { wrapper: createWrapper(store) }
      );

      expect(result.current.scrobbleTimeOffset).toBe(0);

      act(() => {
        result.current.setScrobbleTimeOffset(-3600); // 1 hour in the past
      });

      expect(result.current.scrobbleTimeOffset).toBe(-3600);
    });
  });

  describe('totalSelectedTracks', () => {
    it('should return correct total selected tracks count', () => {
      const { result } = renderHook(
        () => useQueue(connectedCredentials, defaultSettings, mockOnQueueSuccess),
        { wrapper: createWrapper(store) }
      );

      // Initially should be 0
      expect(result.current.totalSelectedTracks).toBe(0);
    });
  });
});
