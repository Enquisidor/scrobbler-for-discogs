import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { QueueItem } from '../types';

export interface QueueState {
  queue: QueueItem[];
  scrobbledHistory: QueueItem[];
  isScrobbling: boolean;
  scrobbleError: string | null;
  scrobbleTimeOffset: number; // in seconds
  isHydrated: boolean; // Track whether we've loaded from AsyncStorage
}

// Note: Initial state starts empty - we'll hydrate asynchronously
export const initialQueueState: QueueState = {
  queue: [],
  scrobbledHistory: [],
  isScrobbling: false,
  scrobbleError: null,
  scrobbleTimeOffset: 0,
  isHydrated: false,
};

const queueSlice = createSlice({
  name: 'queue',
  initialState: initialQueueState,
  reducers: {
    // Hydrate queue from AsyncStorage
    hydrateQueue(state, action: PayloadAction<{ queue: QueueItem[] }>) {
      state.queue = action.payload.queue;
      state.isHydrated = true;
    },
    addToQueue(state, action: PayloadAction<QueueItem>) {
      state.queue.push(action.payload);
    },
    updateQueueItem(state, action: PayloadAction<QueueItem>) {
      const index = state.queue.findIndex(item => item.instanceKey === action.payload.instanceKey);
      if (index !== -1) {
        state.queue[index] = action.payload;
      }
    },
    removeFromQueue(state, action: PayloadAction<{ instanceKey: string }>) {
      state.queue = state.queue.filter(item => item.instanceKey !== action.payload.instanceKey);
    },
    removeLastInstanceOf(state, action: PayloadAction<{ releaseId: number }>) {
      let indexToRemove = -1;
      for (let i = state.queue.length - 1; i >= 0; i--) {
        if (state.queue[i].id === action.payload.releaseId) {
          indexToRemove = i;
          break;
        }
      }
      if (indexToRemove !== -1) {
        state.queue.splice(indexToRemove, 1);
      }
    },
    removeAllInstancesOf(state, action: PayloadAction<{ releaseId: number }>) {
      state.queue = state.queue.filter(item => item.id !== action.payload.releaseId);
    },
    setScrobbling(state, action: PayloadAction<boolean>) {
      state.isScrobbling = action.payload;
      state.scrobbleError = null;
    },
    setScrobbleError(state, action: PayloadAction<string | null>) {
      state.scrobbleError = action.payload;
      state.isScrobbling = false;
    },
    scrobbleSuccess(state, action: PayloadAction<{ itemsToMove: QueueItem[] }>) {
      state.queue = [];
      state.scrobbledHistory = [...action.payload.itemsToMove, ...state.scrobbledHistory];
      state.isScrobbling = false;
    },
    scrobbleSingleSuccess(state, action: PayloadAction<{ scrobbledItem: QueueItem }>) {
      state.queue = state.queue.filter(item => item.instanceKey !== action.payload.scrobbledItem.instanceKey);
      state.scrobbledHistory = [action.payload.scrobbledItem, ...state.scrobbledHistory];
      state.isScrobbling = false;
    },
    clearQueue(state) {
      state.queue = [];
    },
    setTimeOffset(state, action: PayloadAction<number>) {
      state.scrobbleTimeOffset = action.payload;
    },
    updateScrobbleMode(state, action: PayloadAction<{ instanceKey: string; useTrackArtist: boolean }>) {
      const item = state.queue.find(i => i.instanceKey === action.payload.instanceKey);
      if (item) {
        item.useTrackArtist = action.payload.useTrackArtist;
      }
    },
  },
});

export const {
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
} = queueSlice.actions;

export default queueSlice.reducer;
