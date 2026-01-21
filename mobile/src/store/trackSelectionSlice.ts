import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { QueueItem, SelectedTracks, SelectedFeatures, ArtistSelections, Settings, DiscogsTrack } from '@libs';
import { getTrackFeaturedArtists } from '@libs';
import { getDisplayArtistName } from '@libs';

export interface TrackSelectionState {
  selectedTracks: SelectedTracks;
  selectedFeatures: SelectedFeatures;
  artistSelections: ArtistSelections;
}

export const initialState: TrackSelectionState = {
  selectedTracks: {},
  selectedFeatures: {},
  artistSelections: {},
};

const trackSelectionSlice = createSlice({
  name: 'trackSelection',
  initialState,
  reducers: {
    initializeSelection(state, action: PayloadAction<{ item: QueueItem; settings: Settings }>) {
      const { item, settings } = action.payload;
      const { instanceKey, tracklist } = item;

      const newSelectedTracks = new Set<string>();
      const newSelectedFeatures = new Set<string>();

      if (settings.selectAllTracksPerRelease && tracklist?.length) {
        tracklist.forEach((track, pIndex) => {
          if (track.type_ === 'heading') return;
          const hasSubTracks = track.sub_tracks && track.sub_tracks.length > 0;
          if (hasSubTracks) {
            if (settings.selectSubtracksByDefault) {
              track.sub_tracks!.forEach((subTrack, sIndex) => {
                const key = `${pIndex}-${sIndex}`;
                newSelectedTracks.add(key);
                if (settings.showFeatures && settings.selectFeaturesByDefault && getTrackFeaturedArtists(subTrack)) {
                  newSelectedFeatures.add(key);
                }
              });
            } else {
              const key = String(pIndex);
              newSelectedTracks.add(key);
              if (settings.showFeatures && settings.selectFeaturesByDefault && getTrackFeaturedArtists(track)) {
                newSelectedFeatures.add(key);
              }
            }
          } else {
            const key = String(pIndex);
            newSelectedTracks.add(key);
            if (settings.showFeatures && settings.selectFeaturesByDefault && getTrackFeaturedArtists(track)) {
              newSelectedFeatures.add(key);
            }
          }
        });
      }

      const newArtistSelections: Record<string, Set<string>> = {};
      if (tracklist?.length) {
        tracklist.forEach((track, pIndex) => {
          const processTrack = (t: DiscogsTrack, key: string) => {
            const selectedSet = new Set<string>();
            if (t.artists) {
              t.artists.forEach(a => selectedSet.add(getDisplayArtistName(a.name)));
            }
            if (settings.showFeatures && settings.selectFeaturesByDefault && t.extraartists) {
              t.extraartists
                .filter(a => a.role.toLowerCase().includes('feat'))
                .forEach(a => selectedSet.add(getDisplayArtistName(a.name)));
            }
            if (selectedSet.size > 0) newArtistSelections[key] = selectedSet;
          };
          if (track.sub_tracks && track.sub_tracks.length > 0) {
            track.sub_tracks.forEach((sub, sIndex) => processTrack(sub, `${pIndex}-${sIndex}`));
          }
          processTrack(track, String(pIndex));
        });
      }

      // Immer allows direct assignment, but we are working with objects/maps.
      state.selectedTracks[instanceKey] = newSelectedTracks;
      state.selectedFeatures[instanceKey] = newSelectedFeatures;
      state.artistSelections[instanceKey] = newArtistSelections;
    },
    clearSelectionForInstance(state, action: PayloadAction<{ instanceKey: string }>) {
      const { instanceKey } = action.payload;
      delete state.selectedTracks[instanceKey];
      delete state.selectedFeatures[instanceKey];
      delete state.artistSelections[instanceKey];
    },
    resetSelections() {
      return initialState;
    },
    toggleTrack(state, action: PayloadAction<{ instanceKey: string; trackKey: string }>) {
      const { instanceKey, trackKey } = action.payload;
      // Ensure the Set exists in state (RTK proxies map lookups)
      if (!state.selectedTracks[instanceKey]) state.selectedTracks[instanceKey] = new Set();

      const instanceSet = state.selectedTracks[instanceKey];
      const isAdding = !instanceSet.has(trackKey);

      if (isAdding) {
        instanceSet.add(trackKey);
      } else {
        instanceSet.delete(trackKey);
        // Also deselect feature if track is deselected
        const featureSet = state.selectedFeatures[instanceKey];
        if (featureSet && featureSet.has(trackKey)) {
          featureSet.delete(trackKey);
        }
      }
    },
    toggleFeature(state, action: PayloadAction<{ instanceKey: string; trackKey: string }>) {
      const { instanceKey, trackKey } = action.payload;
      if (!state.selectedFeatures[instanceKey]) state.selectedFeatures[instanceKey] = new Set();

      const instanceSet = state.selectedFeatures[instanceKey];
      if (instanceSet.has(trackKey)) {
        instanceSet.delete(trackKey);
      } else {
        instanceSet.add(trackKey);
      }
    },
    toggleArtist(state, action: PayloadAction<{ instanceKey: string; trackKey: string; artistName: string }>) {
      const { instanceKey, trackKey, artistName } = action.payload;
      if (!state.artistSelections[instanceKey]) state.artistSelections[instanceKey] = {};
      if (!state.artistSelections[instanceKey][trackKey]) state.artistSelections[instanceKey][trackKey] = new Set();

      const trackSet = state.artistSelections[instanceKey][trackKey];
      if (trackSet.has(artistName)) {
        trackSet.delete(artistName);
      } else {
        trackSet.add(artistName);
      }
    },
    toggleScrobbleMode(state, action: PayloadAction<{ instanceKey: string; useTrackArtist: boolean; item: QueueItem }>) {
      const { instanceKey, useTrackArtist, item } = action.payload;
      if (!item.tracklist) return;

      if (!state.artistSelections[instanceKey]) state.artistSelections[instanceKey] = {};
      const instanceMap = state.artistSelections[instanceKey];

      const processTrack = (t: DiscogsTrack, key: string) => {
        if (!instanceMap[key]) instanceMap[key] = new Set();
        const currentSet = instanceMap[key];

        if (t.artists) {
          t.artists.forEach(a => {
            const name = getDisplayArtistName(a.name);
            if (useTrackArtist) currentSet.add(name);
            else currentSet.delete(name);
          });
        }
      };

      item.tracklist.forEach((track, pIndex) => {
        if (track.sub_tracks) track.sub_tracks.forEach((sub, sIndex) => processTrack(sub, `${pIndex}-${sIndex}`));
        processTrack(track, String(pIndex));
      });
    },
    toggleParent(state, action: PayloadAction<{ instanceKey: string; subTrackKeys: string[]; parentKey: string }>) {
      const { instanceKey, subTrackKeys, parentKey } = action.payload;
      if (subTrackKeys.length === 0) return;

      if (!state.selectedTracks[instanceKey]) state.selectedTracks[instanceKey] = new Set();
      const selectedSet = state.selectedTracks[instanceKey];

      const numSelectedSubtracks = subTrackKeys.filter(key => selectedSet.has(key)).length;
      const shouldSelectAllSubTracks = numSelectedSubtracks < subTrackKeys.length;

      selectedSet.delete(parentKey);

      if (shouldSelectAllSubTracks) {
        subTrackKeys.forEach(key => selectedSet.add(key));
      } else {
        subTrackKeys.forEach(key => selectedSet.delete(key));
      }
    },
    selectParentAsSingle(state, action: PayloadAction<{ instanceKey: string; parentKey: string; subTrackKeys: string[] }>) {
      const { instanceKey, parentKey, subTrackKeys } = action.payload;
      if (!state.selectedTracks[instanceKey]) state.selectedTracks[instanceKey] = new Set();
      const newSelectedTracks = state.selectedTracks[instanceKey];

      subTrackKeys.forEach(key => newSelectedTracks.delete(key));
      newSelectedTracks.add(parentKey);
    },
    selectAll(state, action: PayloadAction<{ instanceKey: string; item: QueueItem }>) {
      const { instanceKey, item } = action.payload;
      if (!item.tracklist) return;

      const allKeys = new Set<string>();
      item.tracklist.forEach((track, pIndex) => {
        if (track.type_ === 'heading') return;
        if (track.sub_tracks?.length) track.sub_tracks.forEach((_, sIndex) => allKeys.add(`${pIndex}-${sIndex}`));
        else allKeys.add(String(pIndex));
      });
      state.selectedTracks[instanceKey] = allKeys;
    },
    deselectAll(state, action: PayloadAction<{ instanceKey: string }>) {
      state.selectedTracks[action.payload.instanceKey] = new Set();
    },
    toggleGroup(state, action: PayloadAction<{ instanceKey: string; groupKeys: string[]; parentKeysInGroup: string[] }>) {
      const { instanceKey, groupKeys, parentKeysInGroup } = action.payload;
      if (groupKeys.length === 0) return;

      if (!state.selectedTracks[instanceKey]) state.selectedTracks[instanceKey] = new Set();
      const newSelectedTracks = state.selectedTracks[instanceKey];

      const shouldSelectAll = groupKeys.some(key => !newSelectedTracks.has(key));

      if (shouldSelectAll) {
        parentKeysInGroup.forEach(k => newSelectedTracks.delete(k));
        groupKeys.forEach(key => newSelectedTracks.add(key));
      } else {
        groupKeys.forEach(key => newSelectedTracks.delete(key));
      }
    },
    autoUpdateFeatures(state, action: PayloadAction<{ queue: QueueItem[], settings: Settings, selectedTracks: SelectedTracks }>) {
      const { queue, settings, selectedTracks } = action.payload;
      // With Immer, we can mutate "state" directly, but since this action completely re-evaluates
      // the selectedFeatures map based on current settings and selections, we can construct the new map
      // and assign it.
      const newSelectedFeatures: SelectedFeatures = {};

      for (const item of queue) {
        const instanceKey = item.instanceKey;
        const newInstanceFeatures = new Set<string>();

        if (settings.showFeatures && settings.selectFeaturesByDefault) {
          const currentSelectedTracks = selectedTracks[instanceKey];
          if (currentSelectedTracks) {
            for (const trackKey of currentSelectedTracks) {
              const ids = trackKey.split('-').map(Number);
              const parentTrack = item.tracklist?.[ids[0]];
              const track = ids.length > 1 ? parentTrack?.sub_tracks?.[ids[1]] : parentTrack;

              if (track && getTrackFeaturedArtists(track)) {
                newInstanceFeatures.add(trackKey);
              }
            }
          }
        }
        // Only add entry if there are actually selected features
        if (newInstanceFeatures.size > 0) {
          newSelectedFeatures[instanceKey] = newInstanceFeatures;
        }
      }

      // Optimization: Check if actually different before replacing to avoid re-renders?
      // Immer handles reference equality checks for us if we mutate. 
      // Here we just replace the whole object.
      state.selectedFeatures = newSelectedFeatures;
    }
  },
});

export const {
  initializeSelection,
  clearSelectionForInstance,
  resetSelections,
  toggleTrack,
  toggleFeature,
  toggleArtist,
  toggleScrobbleMode,
  toggleParent,
  selectParentAsSingle,
  selectAll,
  deselectAll,
  toggleGroup,
  autoUpdateFeatures,
} = trackSelectionSlice.actions;

export default trackSelectionSlice.reducer;