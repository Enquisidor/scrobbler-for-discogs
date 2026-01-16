import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { CombinedMetadata, ServiceMetadata } from '@libs';

export interface MetadataState {
  data: Record<number, CombinedMetadata>;
  isHydrated: boolean; // Track whether we've loaded from AsyncStorage
}

// Note: Initial state starts empty - we'll hydrate asynchronously
const initialState: MetadataState = {
  data: {},
  isHydrated: false,
};

const metadataSlice = createSlice({
  name: 'metadata',
  initialState,
  reducers: {
    // Hydrate metadata from AsyncStorage
    hydrateMetadata(state, action: PayloadAction<{ data: Record<number, CombinedMetadata> }>) {
      state.data = action.payload.data;
      state.isHydrated = true;
    },
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

export const { hydrateMetadata, updateMetadataItem, clearMetadata } = metadataSlice.actions;
export default metadataSlice.reducer;
