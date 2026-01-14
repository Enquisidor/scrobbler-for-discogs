import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { CombinedMetadata, ServiceMetadata } from 'scrobbler-for-discogs-libs';

export interface MetadataState {
  data: Record<number, CombinedMetadata>;
}

const STORAGE_KEY = 'vinyl-scrobbler-metadata-v4'; // Bumped for MB

const loadInitialState = (): MetadataState => {
  try {
    const item = localStorage.getItem(STORAGE_KEY);
    return { data: item ? JSON.parse(item) : {} };
  } catch (error) {
    console.error('Failed to load metadata from local storage:', error);
    return { data: {} };
  }
};

const metadataSlice = createSlice({
  name: 'metadata',
  initialState: loadInitialState(),
  reducers: {
    updateMetadataItem(state, action: PayloadAction<{ releaseId: number; provider: 'apple' | 'musicbrainz'; metadata: ServiceMetadata }>) {
      const { releaseId, provider, metadata } = action.payload;
      if (!state.data[releaseId]) {
          state.data[releaseId] = {};
      }
      state.data[releaseId][provider] = metadata;
    },
    clearMetadata(state) {
      state.data = {};
    },
  },
});

export const { updateMetadataItem, clearMetadata } = metadataSlice.actions;
export default metadataSlice.reducer;