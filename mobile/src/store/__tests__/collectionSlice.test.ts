/**
 * Tests for collectionSlice
 *
 * Priority 2 - High: Collection state, sync progress, error states
 *
 * Covers:
 * - Loading states
 * - Initial collection setting
 * - Page sync and merge
 * - Error handling
 * - Auth error handling
 * - Collection reset
 */
import reducer, {
  initialCollectionState,
  startLoading,
  setInitialCollection,
  syncPageSuccess,
  syncComplete,
  setError,
  setRateLimitError,
  clearError,
  setAuthError,
  resetCollection,
} from '../collectionSlice';
import { createMockRelease } from '../../__tests__/testUtils';

describe('collectionSlice', () => {
  describe('initial state', () => {
    it('should have empty collection', () => {
      expect(initialCollectionState.collection).toEqual([]);
    });

    it('should not be loading initially', () => {
      expect(initialCollectionState.isLoading).toBe(false);
    });

    it('should not be syncing initially', () => {
      expect(initialCollectionState.isSyncing).toBe(false);
    });

    it('should have no error initially', () => {
      expect(initialCollectionState.error).toBeNull();
    });

    it('should not have auth error initially', () => {
      expect(initialCollectionState.isAuthError).toBe(false);
    });
  });

  describe('startLoading', () => {
    it('should set isLoading to true', () => {
      const state = reducer(initialCollectionState, startLoading());
      expect(state.isLoading).toBe(true);
    });

    it('should clear existing collection', () => {
      const stateWithCollection = {
        ...initialCollectionState,
        collection: [createMockRelease()],
      };
      const state = reducer(stateWithCollection, startLoading());
      expect(state.collection).toEqual([]);
    });

    it('should clear error', () => {
      const stateWithError = {
        ...initialCollectionState,
        error: 'Previous error',
      };
      const state = reducer(stateWithError, startLoading());
      expect(state.error).toBeNull();
    });

    it('should clear auth error', () => {
      const stateWithAuthError = {
        ...initialCollectionState,
        isAuthError: true,
      };
      const state = reducer(stateWithAuthError, startLoading());
      expect(state.isAuthError).toBe(false);
    });
  });

  describe('setInitialCollection', () => {
    it('should set collection from releases', () => {
      const releases = [createMockRelease(), createMockRelease()];
      const state = reducer(
        { ...initialCollectionState, isLoading: true },
        setInitialCollection({ releases, totalPages: 1 })
      );

      expect(state.collection).toHaveLength(2);
    });

    it('should set isLoading to false', () => {
      const state = reducer(
        { ...initialCollectionState, isLoading: true },
        setInitialCollection({ releases: [], totalPages: 1 })
      );
      expect(state.isLoading).toBe(false);
    });

    it('should set isSyncing to true when multiple pages', () => {
      const state = reducer(
        initialCollectionState,
        setInitialCollection({ releases: [], totalPages: 3 })
      );
      expect(state.isSyncing).toBe(true);
    });

    it('should set isSyncing to false when single page', () => {
      const state = reducer(
        initialCollectionState,
        setInitialCollection({ releases: [], totalPages: 1 })
      );
      expect(state.isSyncing).toBe(false);
    });

    it('should format artist display names', () => {
      const release = createMockRelease();
      release.basic_information.artists = [
        { name: 'Artist 1', id: 1, anv: '', join: ' & ', role: '', tracks: '', resource_url: '' },
        { name: 'Artist 2', id: 2, anv: '', join: '', role: '', tracks: '', resource_url: '' },
      ];

      const state = reducer(
        initialCollectionState,
        setInitialCollection({ releases: [release], totalPages: 1 })
      );

      // Should have formatted artist name
      expect(state.collection[0].basic_information.artist_display_name).toBeDefined();
    });
  });

  describe('syncPageSuccess', () => {
    it('should merge new releases into collection', () => {
      const initialRelease = createMockRelease({ id: 1 });
      const stateWithCollection = {
        ...initialCollectionState,
        collection: [initialRelease],
        isSyncing: true,
      };

      const newRelease = createMockRelease({ id: 2 });
      const state = reducer(stateWithCollection, syncPageSuccess([newRelease]));

      expect(state.collection).toHaveLength(2);
    });

    it('should not duplicate existing releases', () => {
      const existingRelease = createMockRelease({ id: 1 });
      const stateWithCollection = {
        ...initialCollectionState,
        collection: [existingRelease],
        isSyncing: true,
      };

      // Same instance_id as existing (mergePageIntoCollection dedupes by instance_id)
      const duplicateRelease = { ...createMockRelease({ id: 1 }), instance_id: existingRelease.instance_id };
      const state = reducer(stateWithCollection, syncPageSuccess([duplicateRelease]));

      // mergePageIntoCollection should handle deduplication by instance_id
      expect(state.collection.filter(r => r.instance_id === existingRelease.instance_id)).toHaveLength(1);
    });
  });

  describe('syncComplete', () => {
    it('should set isSyncing to false', () => {
      const syncingState = { ...initialCollectionState, isSyncing: true };
      const state = reducer(syncingState, syncComplete());
      expect(state.isSyncing).toBe(false);
    });
  });

  describe('setError', () => {
    it('should set error message', () => {
      const state = reducer(initialCollectionState, setError('Something went wrong'));
      expect(state.error).toBe('Something went wrong');
    });

    it('should set isLoading to false', () => {
      const loadingState = { ...initialCollectionState, isLoading: true };
      const state = reducer(loadingState, setError('Error'));
      expect(state.isLoading).toBe(false);
    });

    it('should set isSyncing to false', () => {
      const syncingState = { ...initialCollectionState, isSyncing: true };
      const state = reducer(syncingState, setError('Error'));
      expect(state.isSyncing).toBe(false);
    });
  });

  describe('setRateLimitError', () => {
    it('should set error message but not stop loading/syncing', () => {
      const syncingState = { ...initialCollectionState, isSyncing: true, isLoading: false };
      const state = reducer(syncingState, setRateLimitError('Rate limited'));

      expect(state.error).toBe('Rate limited');
      // Should not change loading/syncing states
      expect(state.isSyncing).toBe(true);
    });
  });

  describe('clearError', () => {
    it('should clear error', () => {
      const stateWithError = { ...initialCollectionState, error: 'Some error' };
      const state = reducer(stateWithError, clearError());
      expect(state.error).toBeNull();
    });
  });

  describe('setAuthError', () => {
    it('should set isAuthError to true', () => {
      const state = reducer(initialCollectionState, setAuthError());
      expect(state.isAuthError).toBe(true);
    });

    it('should set isLoading to false', () => {
      const loadingState = { ...initialCollectionState, isLoading: true };
      const state = reducer(loadingState, setAuthError());
      expect(state.isLoading).toBe(false);
    });

    it('should set isSyncing to false', () => {
      const syncingState = { ...initialCollectionState, isSyncing: true };
      const state = reducer(syncingState, setAuthError());
      expect(state.isSyncing).toBe(false);
    });
  });

  describe('resetCollection', () => {
    it('should reset to initial state', () => {
      const stateWithData = {
        collection: [createMockRelease(), createMockRelease()],
        isLoading: true,
        isSyncing: true,
        error: 'Some error',
        isAuthError: true,
      };

      const state = reducer(stateWithData, resetCollection());

      expect(state.collection).toEqual([]);
      expect(state.isLoading).toBe(false);
      expect(state.isSyncing).toBe(false);
      expect(state.error).toBeNull();
      expect(state.isAuthError).toBe(false);
    });
  });

  describe('reducer integration', () => {
    it('should handle full sync flow', () => {
      // Start
      let state = reducer(initialCollectionState, startLoading());
      expect(state.isLoading).toBe(true);

      // Initial page
      const page1 = [createMockRelease({ id: 1 }), createMockRelease({ id: 2 })];
      state = reducer(state, setInitialCollection({ releases: page1, totalPages: 2 }));
      expect(state.isLoading).toBe(false);
      expect(state.isSyncing).toBe(true);
      expect(state.collection).toHaveLength(2);

      // Sync page 2
      const page2 = [createMockRelease({ id: 3 }), createMockRelease({ id: 4 })];
      state = reducer(state, syncPageSuccess(page2));
      expect(state.collection).toHaveLength(4);

      // Complete
      state = reducer(state, syncComplete());
      expect(state.isSyncing).toBe(false);
    });

    it('should handle auth error during sync', () => {
      let state = reducer(initialCollectionState, startLoading());

      // Initial page succeeds
      state = reducer(
        state,
        setInitialCollection({ releases: [createMockRelease()], totalPages: 2 })
      );
      expect(state.isSyncing).toBe(true);

      // Auth error on subsequent page
      state = reducer(state, setAuthError());
      expect(state.isAuthError).toBe(true);
      expect(state.isSyncing).toBe(false);
      // Collection should still have initial data
      expect(state.collection).toHaveLength(1);
    });
  });
});
