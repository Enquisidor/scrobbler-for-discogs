import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { QueueItem } from '../libs';

export interface QueueState {
  queue: QueueItem[];
  scrobbledHistory: QueueItem[];
  isScrobbling: boolean;
  scrobbleError: string | null;
  scrobbleTimeOffset: number; // in seconds
}

const QUEUE_STORAGE_KEY = 'vinyl-scrobbler-queue-v1';

const loadQueueFromStorage = (): QueueItem[] => {
  try {
    const item = localStorage.getItem(QUEUE_STORAGE_KEY);
    if (item) {
      const parsed = JSON.parse(item);
      // Validate that it's an array of QueueItems
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (error) {
    console.error('Failed to load queue from localStorage:', error);
  }
  return [];
};

export const initialState: QueueState = {
  queue: loadQueueFromStorage(),
  scrobbledHistory: [],
  isScrobbling: false,
  scrobbleError: null,
  scrobbleTimeOffset: 0,
};

const queueSlice = createSlice({
  name: 'queue',
  initialState,
  reducers: {
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
      // Immer allows mutation, but since we need to find last index,
      // creating a new array is sometimes cleaner or using findLastIndex logic.
      // We'll stick to array mutation methods supported by Immer.
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
