/**
 * Tests for queueSlice
 *
 * Priority 1 - Critical: Core queue state - add/remove/scrobble operations
 *
 * Covers:
 * - Adding items to queue
 * - Removing items (single instance, last instance, all instances)
 * - Scrobbling (single and batch)
 * - Queue hydration from storage
 * - Scrobble state management
 */
import reducer, {
  initialState,
  hydrateQueue,
  addToQueue,
  updateQueueItem,
  removeFromQueue,
  removeLastInstanceOf,
  removeAllInstancesOf,
  setScrobbling,
  setScrobbleError,
  scrobbleSuccess,
  scrobbleSingleSuccess,
  clearQueue,
  setTimeOffset,
  updateScrobbleMode,
} from '../queueSlice';
import { createMockQueueItem, createMockQueueItemWithTracks } from '../../__tests__/testUtils';

describe('queueSlice', () => {
  describe('initial state', () => {
    it('should have empty queue', () => {
      expect(initialState.queue).toEqual([]);
    });

    it('should have empty scrobbled history', () => {
      expect(initialState.scrobbledHistory).toEqual([]);
    });

    it('should not be scrobbling initially', () => {
      expect(initialState.isScrobbling).toBe(false);
    });

    it('should have no scrobble error initially', () => {
      expect(initialState.scrobbleError).toBeNull();
    });

    it('should have zero time offset initially', () => {
      expect(initialState.scrobbleTimeOffset).toBe(0);
    });

    it('should not be hydrated initially', () => {
      expect(initialState.isHydrated).toBe(false);
    });
  });

  describe('hydrateQueue', () => {
    it('should set queue from payload and mark as hydrated', () => {
      const items = [createMockQueueItem(), createMockQueueItem()];
      const state = reducer(initialState, hydrateQueue({ queue: items }));

      expect(state.queue).toEqual(items);
      expect(state.isHydrated).toBe(true);
    });

    it('should replace existing queue', () => {
      const existingState = {
        ...initialState,
        queue: [createMockQueueItem()],
      };
      const newItems = [createMockQueueItem(), createMockQueueItem()];

      const state = reducer(existingState, hydrateQueue({ queue: newItems }));

      expect(state.queue).toHaveLength(2);
      expect(state.queue).toEqual(newItems);
    });
  });

  describe('addToQueue', () => {
    it('should add item to empty queue', () => {
      const item = createMockQueueItem();
      const state = reducer(initialState, addToQueue(item));

      expect(state.queue).toHaveLength(1);
      expect(state.queue[0]).toEqual(item);
    });

    it('should add item to end of existing queue', () => {
      const item1 = createMockQueueItem({ id: 1 });
      const item2 = createMockQueueItem({ id: 2 });

      let state = reducer(initialState, addToQueue(item1));
      state = reducer(state, addToQueue(item2));

      expect(state.queue).toHaveLength(2);
      expect(state.queue[1].id).toBe(2);
    });

    it('should allow multiple instances of same release', () => {
      const item1 = createMockQueueItem({ id: 123 });
      const item2 = createMockQueueItem({ id: 123 });
      // Different instanceKey but same release id
      item2.instanceKey = 'different-instance-key';

      let state = reducer(initialState, addToQueue(item1));
      state = reducer(state, addToQueue(item2));

      expect(state.queue).toHaveLength(2);
      expect(state.queue.filter(i => i.id === 123)).toHaveLength(2);
    });
  });

  describe('updateQueueItem', () => {
    it('should update existing item by instanceKey', () => {
      const item = createMockQueueItem({ isLoading: true });
      let state = reducer(initialState, addToQueue(item));

      const updatedItem = { ...item, isLoading: false, tracklist: [] };
      state = reducer(state, updateQueueItem(updatedItem));

      expect(state.queue[0].isLoading).toBe(false);
      expect(state.queue[0].tracklist).toEqual([]);
    });

    it('should not modify queue if instanceKey not found', () => {
      const item = createMockQueueItem();
      let state = reducer(initialState, addToQueue(item));

      const nonExistentItem = createMockQueueItem();
      nonExistentItem.instanceKey = 'non-existent';

      state = reducer(state, updateQueueItem(nonExistentItem));

      expect(state.queue).toHaveLength(1);
      expect(state.queue[0]).toEqual(item);
    });
  });

  describe('removeFromQueue', () => {
    it('should remove item by instanceKey', () => {
      const item1 = createMockQueueItem();
      const item2 = createMockQueueItem();

      let state = reducer(initialState, addToQueue(item1));
      state = reducer(state, addToQueue(item2));
      state = reducer(state, removeFromQueue({ instanceKey: item1.instanceKey }));

      expect(state.queue).toHaveLength(1);
      expect(state.queue[0].instanceKey).toBe(item2.instanceKey);
    });

    it('should handle removing from empty queue', () => {
      const state = reducer(initialState, removeFromQueue({ instanceKey: 'non-existent' }));
      expect(state.queue).toEqual([]);
    });
  });

  describe('removeLastInstanceOf', () => {
    it('should remove last instance of release by id', () => {
      const item1 = createMockQueueItem({ id: 123 });
      item1.instanceKey = 'first';
      const item2 = createMockQueueItem({ id: 456 });
      item2.instanceKey = 'second';
      const item3 = createMockQueueItem({ id: 123 });
      item3.instanceKey = 'third';

      let state = reducer(initialState, addToQueue(item1));
      state = reducer(state, addToQueue(item2));
      state = reducer(state, addToQueue(item3));

      state = reducer(state, removeLastInstanceOf({ releaseId: 123 }));

      expect(state.queue).toHaveLength(2);
      expect(state.queue.map(i => i.instanceKey)).toEqual(['first', 'second']);
    });

    it('should do nothing if release not in queue', () => {
      const item = createMockQueueItem({ id: 123 });
      let state = reducer(initialState, addToQueue(item));

      state = reducer(state, removeLastInstanceOf({ releaseId: 999 }));

      expect(state.queue).toHaveLength(1);
    });
  });

  describe('removeAllInstancesOf', () => {
    it('should remove all instances of release by id', () => {
      const item1 = createMockQueueItem({ id: 123 });
      const item2 = createMockQueueItem({ id: 456 });
      const item3 = createMockQueueItem({ id: 123 });

      let state = reducer(initialState, addToQueue(item1));
      state = reducer(state, addToQueue(item2));
      state = reducer(state, addToQueue(item3));

      state = reducer(state, removeAllInstancesOf({ releaseId: 123 }));

      expect(state.queue).toHaveLength(1);
      expect(state.queue[0].id).toBe(456);
    });

    it('should handle removing when no instances exist', () => {
      const item = createMockQueueItem({ id: 123 });
      let state = reducer(initialState, addToQueue(item));

      state = reducer(state, removeAllInstancesOf({ releaseId: 999 }));

      expect(state.queue).toHaveLength(1);
    });
  });

  describe('setScrobbling', () => {
    it('should set isScrobbling to true', () => {
      const state = reducer(initialState, setScrobbling(true));
      expect(state.isScrobbling).toBe(true);
    });

    it('should clear scrobble error when starting', () => {
      const stateWithError = {
        ...initialState,
        scrobbleError: 'Previous error',
      };
      const state = reducer(stateWithError, setScrobbling(true));

      expect(state.scrobbleError).toBeNull();
    });

    it('should set isScrobbling to false', () => {
      const scrobblingState = { ...initialState, isScrobbling: true };
      const state = reducer(scrobblingState, setScrobbling(false));
      expect(state.isScrobbling).toBe(false);
    });
  });

  describe('setScrobbleError', () => {
    it('should set error message and stop scrobbling', () => {
      const scrobblingState = { ...initialState, isScrobbling: true };
      const state = reducer(scrobblingState, setScrobbleError('Failed to scrobble'));

      expect(state.scrobbleError).toBe('Failed to scrobble');
      expect(state.isScrobbling).toBe(false);
    });

    it('should allow clearing error with null', () => {
      const stateWithError = { ...initialState, scrobbleError: 'Error' };
      const state = reducer(stateWithError, setScrobbleError(null));

      expect(state.scrobbleError).toBeNull();
    });
  });

  describe('scrobbleSuccess', () => {
    it('should clear queue and move items to history', () => {
      const items = [
        createMockQueueItemWithTracks(3),
        createMockQueueItemWithTracks(3),
      ];
      let state = { ...initialState, queue: items, isScrobbling: true };

      const itemsToMove = items.map(i => ({
        ...i,
        scrobbledTrackCount: 3,
        scrobbledTrackKeys: ['0', '1', '2'],
      }));

      state = reducer(state, scrobbleSuccess({ itemsToMove }));

      expect(state.queue).toHaveLength(0);
      expect(state.scrobbledHistory).toHaveLength(2);
      expect(state.isScrobbling).toBe(false);
    });

    it('should prepend new items to history', () => {
      const existingHistory = [createMockQueueItemWithTracks(2)];
      let state = {
        ...initialState,
        queue: [createMockQueueItemWithTracks(3)],
        scrobbledHistory: existingHistory,
        isScrobbling: true,
      };

      const newItem = {
        ...state.queue[0],
        scrobbledTrackCount: 3,
      };

      state = reducer(state, scrobbleSuccess({ itemsToMove: [newItem] }));

      expect(state.scrobbledHistory).toHaveLength(2);
      expect(state.scrobbledHistory[0]).toEqual(newItem);
    });
  });

  describe('scrobbleSingleSuccess', () => {
    it('should remove single item from queue and add to history', () => {
      const item1 = createMockQueueItemWithTracks(3);
      const item2 = createMockQueueItemWithTracks(3);
      let state = { ...initialState, queue: [item1, item2], isScrobbling: true };

      const scrobbledItem = {
        ...item1,
        scrobbledTrackCount: 3,
      };

      state = reducer(state, scrobbleSingleSuccess({ scrobbledItem }));

      expect(state.queue).toHaveLength(1);
      expect(state.queue[0].instanceKey).toBe(item2.instanceKey);
      expect(state.scrobbledHistory).toHaveLength(1);
      expect(state.scrobbledHistory[0]).toEqual(scrobbledItem);
      expect(state.isScrobbling).toBe(false);
    });
  });

  describe('clearQueue', () => {
    it('should remove all items from queue', () => {
      const state = {
        ...initialState,
        queue: [createMockQueueItem(), createMockQueueItem()],
      };

      const newState = reducer(state, clearQueue());

      expect(newState.queue).toHaveLength(0);
    });

    it('should not affect scrobbled history', () => {
      const history = [createMockQueueItem()];
      const state = {
        ...initialState,
        queue: [createMockQueueItem()],
        scrobbledHistory: history,
      };

      const newState = reducer(state, clearQueue());

      expect(newState.scrobbledHistory).toEqual(history);
    });
  });

  describe('setTimeOffset', () => {
    it('should set positive time offset', () => {
      const state = reducer(initialState, setTimeOffset(3600));
      expect(state.scrobbleTimeOffset).toBe(3600);
    });

    it('should set negative time offset', () => {
      const state = reducer(initialState, setTimeOffset(-1800));
      expect(state.scrobbleTimeOffset).toBe(-1800);
    });

    it('should set zero time offset', () => {
      const stateWithOffset = { ...initialState, scrobbleTimeOffset: 3600 };
      const state = reducer(stateWithOffset, setTimeOffset(0));
      expect(state.scrobbleTimeOffset).toBe(0);
    });
  });

  describe('updateScrobbleMode', () => {
    it('should update useTrackArtist for specific item', () => {
      const item = createMockQueueItem();
      item.useTrackArtist = true;
      let state = reducer(initialState, addToQueue(item));

      state = reducer(
        state,
        updateScrobbleMode({ instanceKey: item.instanceKey, useTrackArtist: false })
      );

      expect(state.queue[0].useTrackArtist).toBe(false);
    });

    it('should not modify other items', () => {
      const item1 = createMockQueueItem();
      const item2 = createMockQueueItem();
      item1.useTrackArtist = true;
      item2.useTrackArtist = true;

      let state = reducer(initialState, addToQueue(item1));
      state = reducer(state, addToQueue(item2));

      state = reducer(
        state,
        updateScrobbleMode({ instanceKey: item1.instanceKey, useTrackArtist: false })
      );

      expect(state.queue[0].useTrackArtist).toBe(false);
      expect(state.queue[1].useTrackArtist).toBe(true);
    });

    it('should handle non-existent instanceKey gracefully', () => {
      const item = createMockQueueItem();
      let state = reducer(initialState, addToQueue(item));

      state = reducer(
        state,
        updateScrobbleMode({ instanceKey: 'non-existent', useTrackArtist: false })
      );

      expect(state.queue[0].useTrackArtist).toBe(item.useTrackArtist);
    });
  });
});
