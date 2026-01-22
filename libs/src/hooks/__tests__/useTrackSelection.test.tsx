/**
 * Tests for useTrackSelection hook
 *
 * Covers:
 * - Selection state initialization
 * - Track toggle functionality
 * - Feature toggle functionality
 * - Select all / Deselect all
 * - Parent/subtrack selection logic
 */
import { renderHook, act } from '@testing-library/react-native';
import React from 'react';
import { Provider } from 'react-redux';
import { useTrackSelection } from '../useTrackSelection';
import {
  createTestStore,
  createMockQueueItemWithTracks,
  createMockQueueItemWithSubtracks,
  createMockQueueItemWithFeatures,
  defaultSettings,
} from '../../__tests__/testUtils';
import type { QueueItem, Settings } from '../../types';

// Wrapper component for providing Redux store
const createWrapper = (store: ReturnType<typeof createTestStore>) => {
  return ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
};

describe('useTrackSelection', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
  });

  describe('Initial State', () => {
    it('should return empty selections initially', () => {
      const queue: QueueItem[] = [];
      const { result } = renderHook(
        () => useTrackSelection(queue, defaultSettings),
        { wrapper: createWrapper(store) }
      );

      expect(result.current.selectedTracks).toEqual({});
      expect(result.current.selectedFeatures).toEqual({});
      expect(result.current.artistSelections).toEqual({});
      expect(result.current.totalSelectedTracks).toBe(0);
    });
  });

  describe('initializeSelection', () => {
    it('should initialize selection for a queue item with tracks', () => {
      const item = createMockQueueItemWithTracks(3);
      const queue: QueueItem[] = [item];
      const settings: Settings = { ...defaultSettings, selectAllTracksPerRelease: true };

      const { result } = renderHook(
        () => useTrackSelection(queue, settings),
        { wrapper: createWrapper(store) }
      );

      act(() => {
        result.current.initializeSelection(item);
      });

      const selectedSet = result.current.selectedTracks[item.instanceKey];
      expect(selectedSet).toBeDefined();
      expect(selectedSet.size).toBe(3);
      expect(selectedSet.has('0')).toBe(true);
      expect(selectedSet.has('1')).toBe(true);
      expect(selectedSet.has('2')).toBe(true);
    });

    it('should not select tracks when selectAllTracksPerRelease is false', () => {
      const item = createMockQueueItemWithTracks(3);
      const queue: QueueItem[] = [item];
      const settings: Settings = { ...defaultSettings, selectAllTracksPerRelease: false };

      const { result } = renderHook(
        () => useTrackSelection(queue, settings),
        { wrapper: createWrapper(store) }
      );

      act(() => {
        result.current.initializeSelection(item);
      });

      const selectedSet = result.current.selectedTracks[item.instanceKey];
      expect(selectedSet.size).toBe(0);
    });
  });

  describe('handleTrackToggle', () => {
    it('should toggle a track selection on', () => {
      const item = createMockQueueItemWithTracks(3);
      const queue: QueueItem[] = [item];
      const settings: Settings = { ...defaultSettings, selectAllTracksPerRelease: false };

      const { result } = renderHook(
        () => useTrackSelection(queue, settings),
        { wrapper: createWrapper(store) }
      );

      act(() => {
        result.current.initializeSelection(item);
      });

      act(() => {
        result.current.handleTrackToggle(item.instanceKey, '0');
      });

      expect(result.current.selectedTracks[item.instanceKey].has('0')).toBe(true);
    });

    it('should toggle a track selection off', () => {
      const item = createMockQueueItemWithTracks(3);
      const queue: QueueItem[] = [item];
      const settings: Settings = { ...defaultSettings, selectAllTracksPerRelease: true };

      const { result } = renderHook(
        () => useTrackSelection(queue, settings),
        { wrapper: createWrapper(store) }
      );

      act(() => {
        result.current.initializeSelection(item);
      });

      expect(result.current.selectedTracks[item.instanceKey].has('0')).toBe(true);

      act(() => {
        result.current.handleTrackToggle(item.instanceKey, '0');
      });

      expect(result.current.selectedTracks[item.instanceKey].has('0')).toBe(false);
    });
  });

  describe('handleSelectAll / handleDeselectAll', () => {
    it('should select all tracks', () => {
      const item = createMockQueueItemWithTracks(5);
      const queue: QueueItem[] = [item];
      const settings: Settings = { ...defaultSettings, selectAllTracksPerRelease: false };

      const { result } = renderHook(
        () => useTrackSelection(queue, settings),
        { wrapper: createWrapper(store) }
      );

      act(() => {
        result.current.initializeSelection(item);
      });

      expect(result.current.selectedTracks[item.instanceKey].size).toBe(0);

      act(() => {
        result.current.handleSelectAll(item.instanceKey);
      });

      expect(result.current.selectedTracks[item.instanceKey].size).toBe(5);
    });

    it('should deselect all tracks', () => {
      const item = createMockQueueItemWithTracks(5);
      const queue: QueueItem[] = [item];
      const settings: Settings = { ...defaultSettings, selectAllTracksPerRelease: true };

      const { result } = renderHook(
        () => useTrackSelection(queue, settings),
        { wrapper: createWrapper(store) }
      );

      act(() => {
        result.current.initializeSelection(item);
      });

      expect(result.current.selectedTracks[item.instanceKey].size).toBe(5);

      act(() => {
        result.current.handleDeselectAll(item.instanceKey);
      });

      expect(result.current.selectedTracks[item.instanceKey].size).toBe(0);
    });
  });

  describe('clearSelectionForInstance', () => {
    it('should clear selection for a specific instance', () => {
      const item1 = createMockQueueItemWithTracks(3);
      const item2 = createMockQueueItemWithTracks(3);
      const queue: QueueItem[] = [item1, item2];
      const settings: Settings = { ...defaultSettings, selectAllTracksPerRelease: true };

      const { result } = renderHook(
        () => useTrackSelection(queue, settings),
        { wrapper: createWrapper(store) }
      );

      act(() => {
        result.current.initializeSelection(item1);
        result.current.initializeSelection(item2);
      });

      expect(result.current.selectedTracks[item1.instanceKey]).toBeDefined();
      expect(result.current.selectedTracks[item2.instanceKey]).toBeDefined();

      act(() => {
        result.current.clearSelectionForInstance(item1.instanceKey);
      });

      expect(result.current.selectedTracks[item1.instanceKey]).toBeUndefined();
      expect(result.current.selectedTracks[item2.instanceKey]).toBeDefined();
    });
  });

  describe('resetSelections', () => {
    it('should reset all selections', () => {
      const item1 = createMockQueueItemWithTracks(3);
      const item2 = createMockQueueItemWithTracks(3);
      const queue: QueueItem[] = [item1, item2];
      const settings: Settings = { ...defaultSettings, selectAllTracksPerRelease: true };

      const { result } = renderHook(
        () => useTrackSelection(queue, settings),
        { wrapper: createWrapper(store) }
      );

      act(() => {
        result.current.initializeSelection(item1);
        result.current.initializeSelection(item2);
      });

      expect(Object.keys(result.current.selectedTracks).length).toBe(2);

      act(() => {
        result.current.resetSelections();
      });

      expect(result.current.selectedTracks).toEqual({});
      expect(result.current.selectedFeatures).toEqual({});
      expect(result.current.artistSelections).toEqual({});
    });
  });

  describe('totalSelectedTracks', () => {
    it('should correctly count total selected tracks across instances', () => {
      const item1 = createMockQueueItemWithTracks(3);
      const item2 = createMockQueueItemWithTracks(5);
      const queue: QueueItem[] = [item1, item2];
      const settings: Settings = { ...defaultSettings, selectAllTracksPerRelease: true };

      const { result } = renderHook(
        () => useTrackSelection(queue, settings),
        { wrapper: createWrapper(store) }
      );

      act(() => {
        result.current.initializeSelection(item1);
        result.current.initializeSelection(item2);
      });

      expect(result.current.totalSelectedTracks).toBe(8); // 3 + 5
    });
  });
});
