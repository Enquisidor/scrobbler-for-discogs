/**
 * Tests for trackSelectionSlice
 *
 * Priority 1 - Critical: Complex nested selection logic (tracks, subtracks, features)
 *
 * Covers:
 * - Initializing selection based on settings
 * - Track toggle (select/deselect)
 * - Feature toggle
 * - Artist toggle
 * - Parent/subtrack selection logic
 * - Select all / Deselect all
 * - Group toggle
 * - Scrobble mode toggle
 * - Auto-update features
 */
import reducer, {
  initialState,
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
} from '../trackSelectionSlice';
import {
  createMockQueueItemWithTracks,
  createMockQueueItemWithSubtracks,
  createMockQueueItemWithFeatures,
  defaultSettings,
} from '../../__tests__/testUtils';

describe('trackSelectionSlice', () => {
  describe('initial state', () => {
    it('should have empty selected tracks', () => {
      expect(initialState.selectedTracks).toEqual({});
    });

    it('should have empty selected features', () => {
      expect(initialState.selectedFeatures).toEqual({});
    });

    it('should have empty artist selections', () => {
      expect(initialState.artistSelections).toEqual({});
    });
  });

  describe('initializeSelection', () => {
    it('should select all tracks when selectAllTracksPerRelease is true', () => {
      const item = createMockQueueItemWithTracks(3);
      const settings = { ...defaultSettings, selectAllTracksPerRelease: true };

      const state = reducer(
        initialState,
        initializeSelection({ item, settings })
      );

      const selectedSet = state.selectedTracks[item.instanceKey];
      expect(selectedSet.size).toBe(3);
      expect(selectedSet.has('0')).toBe(true);
      expect(selectedSet.has('1')).toBe(true);
      expect(selectedSet.has('2')).toBe(true);
    });

    it('should not select tracks when selectAllTracksPerRelease is false', () => {
      const item = createMockQueueItemWithTracks(3);
      const settings = { ...defaultSettings, selectAllTracksPerRelease: false };

      const state = reducer(
        initialState,
        initializeSelection({ item, settings })
      );

      const selectedSet = state.selectedTracks[item.instanceKey];
      expect(selectedSet.size).toBe(0);
    });

    it('should select subtracks when selectSubtracksByDefault is true', () => {
      const item = createMockQueueItemWithSubtracks();
      const settings = {
        ...defaultSettings,
        selectAllTracksPerRelease: true,
        selectSubtracksByDefault: true,
      };

      const state = reducer(
        initialState,
        initializeSelection({ item, settings })
      );

      const selectedSet = state.selectedTracks[item.instanceKey];
      // Should have subtracks selected (0-0, 0-1, 0-2 for parent 0)
      expect(selectedSet.has('0-0')).toBe(true);
      expect(selectedSet.has('0-1')).toBe(true);
      expect(selectedSet.has('0-2')).toBe(true);
      // Regular track 1 should be selected
      expect(selectedSet.has('1')).toBe(true);
      // Heading (index 2) should be skipped
      // Subtracks of parent 3
      expect(selectedSet.has('3-0')).toBe(true);
      expect(selectedSet.has('3-1')).toBe(true);
    });

    it('should select parent track when selectSubtracksByDefault is false', () => {
      const item = createMockQueueItemWithSubtracks();
      const settings = {
        ...defaultSettings,
        selectAllTracksPerRelease: true,
        selectSubtracksByDefault: false,
      };

      const state = reducer(
        initialState,
        initializeSelection({ item, settings })
      );

      const selectedSet = state.selectedTracks[item.instanceKey];
      // Parent keys should be selected instead of subtracks
      expect(selectedSet.has('0')).toBe(true);
      expect(selectedSet.has('1')).toBe(true);
      expect(selectedSet.has('3')).toBe(true);
      // Subtracks should NOT be selected
      expect(selectedSet.has('0-0')).toBe(false);
    });

    it('should skip heading tracks', () => {
      const item = createMockQueueItemWithSubtracks();
      const settings = {
        ...defaultSettings,
        selectAllTracksPerRelease: true,
      };

      const state = reducer(
        initialState,
        initializeSelection({ item, settings })
      );

      const selectedSet = state.selectedTracks[item.instanceKey];
      // Index 2 is a heading, should not be selected
      expect(selectedSet.has('2')).toBe(false);
    });

    it('should handle item with no tracklist', () => {
      const item = createMockQueueItemWithTracks(0);
      item.tracklist = undefined;

      const state = reducer(
        initialState,
        initializeSelection({ item, settings: defaultSettings })
      );

      expect(state.selectedTracks[item.instanceKey].size).toBe(0);
    });
  });

  describe('clearSelectionForInstance', () => {
    it('should remove all selections for instance', () => {
      const item = createMockQueueItemWithTracks(3);
      let state = reducer(
        initialState,
        initializeSelection({ item, settings: defaultSettings })
      );

      state = reducer(
        state,
        clearSelectionForInstance({ instanceKey: item.instanceKey })
      );

      expect(state.selectedTracks[item.instanceKey]).toBeUndefined();
      expect(state.selectedFeatures[item.instanceKey]).toBeUndefined();
      expect(state.artistSelections[item.instanceKey]).toBeUndefined();
    });
  });

  describe('resetSelections', () => {
    it('should reset to initial state', () => {
      const item = createMockQueueItemWithTracks(3);
      let state = reducer(
        initialState,
        initializeSelection({ item, settings: defaultSettings })
      );

      state = reducer(state, resetSelections());

      expect(state).toEqual(initialState);
    });
  });

  describe('toggleTrack', () => {
    it('should add track to selection', () => {
      const item = createMockQueueItemWithTracks(3);
      const settings = { ...defaultSettings, selectAllTracksPerRelease: false };
      let state = reducer(initialState, initializeSelection({ item, settings }));

      state = reducer(
        state,
        toggleTrack({ instanceKey: item.instanceKey, trackKey: '1' })
      );

      expect(state.selectedTracks[item.instanceKey].has('1')).toBe(true);
    });

    it('should remove track from selection', () => {
      const item = createMockQueueItemWithTracks(3);
      let state = reducer(
        initialState,
        initializeSelection({ item, settings: defaultSettings })
      );

      state = reducer(
        state,
        toggleTrack({ instanceKey: item.instanceKey, trackKey: '1' })
      );

      expect(state.selectedTracks[item.instanceKey].has('1')).toBe(false);
    });

    it('should also remove feature when track is deselected', () => {
      const item = createMockQueueItemWithFeatures();
      const settings = {
        ...defaultSettings,
        selectAllTracksPerRelease: true,
        showFeatures: true,
        selectFeaturesByDefault: true,
      };
      let state = reducer(initialState, initializeSelection({ item, settings }));

      // Manually add feature selection
      state.selectedFeatures[item.instanceKey] = new Set(['0']);

      state = reducer(
        state,
        toggleTrack({ instanceKey: item.instanceKey, trackKey: '0' })
      );

      expect(state.selectedTracks[item.instanceKey].has('0')).toBe(false);
      expect(state.selectedFeatures[item.instanceKey].has('0')).toBe(false);
    });

    it('should create set if instance not initialized', () => {
      const state = reducer(
        initialState,
        toggleTrack({ instanceKey: 'new-instance', trackKey: '0' })
      );

      expect(state.selectedTracks['new-instance']).toBeDefined();
      expect(state.selectedTracks['new-instance'].has('0')).toBe(true);
    });
  });

  describe('toggleFeature', () => {
    it('should add feature to selection', () => {
      const item = createMockQueueItemWithFeatures();
      let state = reducer(
        initialState,
        initializeSelection({ item, settings: defaultSettings })
      );

      state = reducer(
        state,
        toggleFeature({ instanceKey: item.instanceKey, trackKey: '0' })
      );

      expect(state.selectedFeatures[item.instanceKey].has('0')).toBe(true);
    });

    it('should remove feature from selection', () => {
      const item = createMockQueueItemWithFeatures();
      let state = reducer(
        initialState,
        initializeSelection({ item, settings: defaultSettings })
      );

      // Add then remove
      state = reducer(
        state,
        toggleFeature({ instanceKey: item.instanceKey, trackKey: '0' })
      );
      state = reducer(
        state,
        toggleFeature({ instanceKey: item.instanceKey, trackKey: '0' })
      );

      expect(state.selectedFeatures[item.instanceKey].has('0')).toBe(false);
    });
  });

  describe('toggleArtist', () => {
    it('should add artist to selection', () => {
      const item = createMockQueueItemWithTracks(3);
      let state = reducer(
        initialState,
        initializeSelection({ item, settings: defaultSettings })
      );

      state = reducer(
        state,
        toggleArtist({
          instanceKey: item.instanceKey,
          trackKey: '0',
          artistName: 'Guest Artist',
        })
      );

      expect(state.artistSelections[item.instanceKey]['0'].has('Guest Artist')).toBe(true);
    });

    it('should remove artist from selection', () => {
      const item = createMockQueueItemWithTracks(3);
      let state = reducer(
        initialState,
        initializeSelection({ item, settings: defaultSettings })
      );

      // Add then remove
      state = reducer(
        state,
        toggleArtist({
          instanceKey: item.instanceKey,
          trackKey: '0',
          artistName: 'Artist',
        })
      );
      state = reducer(
        state,
        toggleArtist({
          instanceKey: item.instanceKey,
          trackKey: '0',
          artistName: 'Artist',
        })
      );

      expect(state.artistSelections[item.instanceKey]['0'].has('Artist')).toBe(false);
    });
  });

  describe('toggleParent', () => {
    it('should select all subtracks when none selected', () => {
      const item = createMockQueueItemWithSubtracks();
      const settings = { ...defaultSettings, selectAllTracksPerRelease: false };
      let state = reducer(initialState, initializeSelection({ item, settings }));

      const subTrackKeys = ['0-0', '0-1', '0-2'];
      state = reducer(
        state,
        toggleParent({
          instanceKey: item.instanceKey,
          subTrackKeys,
          parentKey: '0',
        })
      );

      const selected = state.selectedTracks[item.instanceKey];
      expect(selected.has('0-0')).toBe(true);
      expect(selected.has('0-1')).toBe(true);
      expect(selected.has('0-2')).toBe(true);
      expect(selected.has('0')).toBe(false); // Parent should be removed
    });

    it('should deselect all subtracks when all selected', () => {
      const item = createMockQueueItemWithSubtracks();
      const settings = {
        ...defaultSettings,
        selectAllTracksPerRelease: true,
        selectSubtracksByDefault: true,
      };
      let state = reducer(initialState, initializeSelection({ item, settings }));

      const subTrackKeys = ['0-0', '0-1', '0-2'];
      state = reducer(
        state,
        toggleParent({
          instanceKey: item.instanceKey,
          subTrackKeys,
          parentKey: '0',
        })
      );

      const selected = state.selectedTracks[item.instanceKey];
      expect(selected.has('0-0')).toBe(false);
      expect(selected.has('0-1')).toBe(false);
      expect(selected.has('0-2')).toBe(false);
    });

    it('should select all when some subtracks selected', () => {
      const item = createMockQueueItemWithSubtracks();
      const settings = { ...defaultSettings, selectAllTracksPerRelease: false };
      let state = reducer(initialState, initializeSelection({ item, settings }));

      // Select just one subtrack
      state = reducer(
        state,
        toggleTrack({ instanceKey: item.instanceKey, trackKey: '0-0' })
      );

      const subTrackKeys = ['0-0', '0-1', '0-2'];
      state = reducer(
        state,
        toggleParent({
          instanceKey: item.instanceKey,
          subTrackKeys,
          parentKey: '0',
        })
      );

      const selected = state.selectedTracks[item.instanceKey];
      expect(selected.has('0-0')).toBe(true);
      expect(selected.has('0-1')).toBe(true);
      expect(selected.has('0-2')).toBe(true);
    });
  });

  describe('selectParentAsSingle', () => {
    it('should deselect subtracks and select parent', () => {
      const item = createMockQueueItemWithSubtracks();
      const settings = {
        ...defaultSettings,
        selectAllTracksPerRelease: true,
        selectSubtracksByDefault: true,
      };
      let state = reducer(initialState, initializeSelection({ item, settings }));

      const subTrackKeys = ['0-0', '0-1', '0-2'];
      state = reducer(
        state,
        selectParentAsSingle({
          instanceKey: item.instanceKey,
          parentKey: '0',
          subTrackKeys,
        })
      );

      const selected = state.selectedTracks[item.instanceKey];
      expect(selected.has('0')).toBe(true);
      expect(selected.has('0-0')).toBe(false);
      expect(selected.has('0-1')).toBe(false);
      expect(selected.has('0-2')).toBe(false);
    });
  });

  describe('selectAll', () => {
    it('should select all tracks and subtracks', () => {
      const item = createMockQueueItemWithSubtracks();
      const settings = { ...defaultSettings, selectAllTracksPerRelease: false };
      let state = reducer(initialState, initializeSelection({ item, settings }));

      state = reducer(
        state,
        selectAll({ instanceKey: item.instanceKey, item })
      );

      const selected = state.selectedTracks[item.instanceKey];
      // Subtracks of parent 0
      expect(selected.has('0-0')).toBe(true);
      expect(selected.has('0-1')).toBe(true);
      expect(selected.has('0-2')).toBe(true);
      // Regular track 1
      expect(selected.has('1')).toBe(true);
      // Heading (index 2) should not be selected
      expect(selected.has('2')).toBe(false);
      // Subtracks of parent 3
      expect(selected.has('3-0')).toBe(true);
      expect(selected.has('3-1')).toBe(true);
    });
  });

  describe('deselectAll', () => {
    it('should clear all track selections for instance', () => {
      const item = createMockQueueItemWithTracks(3);
      let state = reducer(
        initialState,
        initializeSelection({ item, settings: defaultSettings })
      );

      state = reducer(state, deselectAll({ instanceKey: item.instanceKey }));

      expect(state.selectedTracks[item.instanceKey].size).toBe(0);
    });
  });

  describe('toggleGroup', () => {
    it('should select all group keys when none selected', () => {
      const item = createMockQueueItemWithSubtracks();
      const settings = { ...defaultSettings, selectAllTracksPerRelease: false };
      let state = reducer(initialState, initializeSelection({ item, settings }));

      const groupKeys = ['0-0', '0-1', '0-2', '1'];
      state = reducer(
        state,
        toggleGroup({
          instanceKey: item.instanceKey,
          groupKeys,
          parentKeysInGroup: ['0'],
        })
      );

      const selected = state.selectedTracks[item.instanceKey];
      groupKeys.forEach(key => {
        expect(selected.has(key)).toBe(true);
      });
    });

    it('should deselect all group keys when all selected', () => {
      const item = createMockQueueItemWithSubtracks();
      const settings = {
        ...defaultSettings,
        selectAllTracksPerRelease: true,
        selectSubtracksByDefault: true,
      };
      let state = reducer(initialState, initializeSelection({ item, settings }));

      const groupKeys = ['0-0', '0-1', '0-2', '1'];
      state = reducer(
        state,
        toggleGroup({
          instanceKey: item.instanceKey,
          groupKeys,
          parentKeysInGroup: ['0'],
        })
      );

      const selected = state.selectedTracks[item.instanceKey];
      groupKeys.forEach(key => {
        expect(selected.has(key)).toBe(false);
      });
    });
  });

  describe('toggleScrobbleMode', () => {
    it('should add track artists when useTrackArtist is true', () => {
      const item = createMockQueueItemWithFeatures();
      let state = reducer(
        initialState,
        initializeSelection({ item, settings: defaultSettings })
      );

      state = reducer(
        state,
        toggleScrobbleMode({
          instanceKey: item.instanceKey,
          useTrackArtist: true,
          item,
        })
      );

      // Track 0 has artists, should be added
      const trackArtists = state.artistSelections[item.instanceKey]['0'];
      expect(trackArtists).toBeDefined();
      expect(trackArtists.has('Main Artist')).toBe(true);
    });

    it('should remove track artists when useTrackArtist is false', () => {
      const item = createMockQueueItemWithFeatures();
      let state = reducer(
        initialState,
        initializeSelection({ item, settings: defaultSettings })
      );

      // First enable
      state = reducer(
        state,
        toggleScrobbleMode({
          instanceKey: item.instanceKey,
          useTrackArtist: true,
          item,
        })
      );

      // Then disable
      state = reducer(
        state,
        toggleScrobbleMode({
          instanceKey: item.instanceKey,
          useTrackArtist: false,
          item,
        })
      );

      const trackArtists = state.artistSelections[item.instanceKey]['0'];
      expect(trackArtists.has('Main Artist')).toBe(false);
    });
  });

  describe('autoUpdateFeatures', () => {
    it('should update features based on settings and selections', () => {
      const item = createMockQueueItemWithFeatures();
      const settings = {
        ...defaultSettings,
        showFeatures: true,
        selectFeaturesByDefault: true,
      };

      // Initialize with track selection
      let state = reducer(
        initialState,
        initializeSelection({ item, settings: { ...settings, selectFeaturesByDefault: false } })
      );

      // Auto-update should add features for selected tracks that have them
      state = reducer(
        state,
        autoUpdateFeatures({
          queue: [item],
          settings,
          selectedTracks: state.selectedTracks,
        })
      );

      // Track 0 and 2 have features and should be selected
      const features = state.selectedFeatures[item.instanceKey];
      expect(features.has('0')).toBe(true);
      expect(features.has('2')).toBe(true);
      // Track 1 has no features
      expect(features.has('1')).toBe(false);
    });

    it('should clear features when showFeatures is false', () => {
      const item = createMockQueueItemWithFeatures();
      const settingsWithFeatures = {
        ...defaultSettings,
        showFeatures: true,
        selectFeaturesByDefault: true,
      };

      let state = reducer(
        initialState,
        initializeSelection({ item, settings: settingsWithFeatures })
      );

      // Update with features disabled
      const settingsWithoutFeatures = {
        ...defaultSettings,
        showFeatures: false,
        selectFeaturesByDefault: false,
      };

      state = reducer(
        state,
        autoUpdateFeatures({
          queue: [item],
          settings: settingsWithoutFeatures,
          selectedTracks: state.selectedTracks,
        })
      );

      // When showFeatures is false, no entry should exist for this instance
      expect(state.selectedFeatures[item.instanceKey]).toBeUndefined();
    });
  });
});
