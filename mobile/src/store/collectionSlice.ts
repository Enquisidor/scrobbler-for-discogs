
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { DiscogsRelease } from '@libs';
import { mergePageIntoCollection } from '@libs';
import { formatArtistNames } from '@libs';

export interface CollectionState {
  collection: DiscogsRelease[];
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;
  isAuthError: boolean;
}

export const initialCollectionState: CollectionState = {
  collection: [],
  isLoading: true,
  isSyncing: false,
  error: null,
  isAuthError: false,
};

// Helper to format raw releases before entering the store
// This ensures that 'artist_display_name' is correctly joined (e.g. "Artist A & Artist B")
// based on the raw 'artists' array data.
const formatReleases = (releases: DiscogsRelease[]): DiscogsRelease[] => {
  return releases.map(release => {
    // guard against missing basic_information
    if (!release.basic_information) return release;

    const artists = release.basic_information.artists;
    // Apply join/format logic here using the utils
    const artistDisplayName = artists && artists.length > 0
      ? formatArtistNames(artists)
      : 'Unknown Artist';

    return {
      ...release,
      basic_information: {
        ...release.basic_information,
        artist_display_name: artistDisplayName
      }
    };
  });
};

const collectionSlice = createSlice({
  name: 'collection',
  initialState: initialCollectionState,
  reducers: {
    startLoading(state) {
      state.isLoading = true;
      state.error = null;
      state.isAuthError = false;
      state.collection = [];
    },
    setInitialCollection(state, action: PayloadAction<{ releases: DiscogsRelease[]; totalPages: number }>) {
      // Format data inside the reducer before setting state
      state.collection = formatReleases(action.payload.releases);
      state.isLoading = false;
      state.isSyncing = action.payload.totalPages > 1;
    },
    syncPageSuccess(state, action: PayloadAction<DiscogsRelease[]>) {
      // Format data inside the reducer before merging
      const formattedReleases = formatReleases(action.payload);
      const result = mergePageIntoCollection(state.collection, formattedReleases);
      state.collection = result.merged;
    },
    syncComplete(state) {
      state.isSyncing = false;
    },
    setError(state, action: PayloadAction<string>) {
      state.error = action.payload;
      state.isLoading = false;
      state.isSyncing = false;
    },
    setRateLimitError(state, action: PayloadAction<string>) {
      state.error = action.payload;
    },
    clearError(state) {
      state.error = null;
    },
    setAuthError(state) {
      state.isAuthError = true;
      state.isLoading = false;
      state.isSyncing = false;
    },
    resetCollection() {
      return { ...initialCollectionState, isLoading: false };
    },
  },
});

export const {
  startLoading,
  setInitialCollection,
  syncPageSuccess,
  syncComplete,
  setError,
  setRateLimitError,
  clearError,
  setAuthError,
  resetCollection,
} = collectionSlice.actions;

export default collectionSlice.reducer;
