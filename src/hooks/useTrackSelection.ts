import { useReducer, useMemo, useCallback, useEffect } from 'react';
import type { QueueItem, Settings } from '../types';
import { trackSelectionReducer, initialState } from '../store/trackSelectionSlice';

export function useTrackSelection(queue: QueueItem[], settings: Settings) {
    const [state, dispatch] = useReducer(trackSelectionReducer, initialState);
    const { selectedTracks, selectedFeatures, artistSelections } = state;

    useEffect(() => {
        dispatch({
            type: 'AUTO_UPDATE_FEATURES',
            payload: { queue, settings, selectedTracks }
        });
    }, [settings.selectFeaturesByDefault, settings.showFeatures, queue, selectedTracks]);

    const initializeSelection = useCallback((item: QueueItem) => {
        dispatch({ type: 'INITIALIZE_SELECTION', payload: { item, settings } });
    }, [settings]);

    const clearSelectionForInstance = useCallback((instanceKey: string) => {
        dispatch({ type: 'CLEAR_SELECTION_FOR_INSTANCE', payload: { instanceKey } });
    }, []);
    
    const resetSelections = useCallback(() => {
        dispatch({ type: 'RESET_SELECTIONS' });
    }, []);

    const handleTrackToggle = useCallback((instanceKey: string, trackKey: string) => {
        dispatch({ type: 'TOGGLE_TRACK', payload: { instanceKey, trackKey } });
    }, []);
    
    const handleFeatureToggle = useCallback((instanceKey: string, trackKey: string) => {
        dispatch({ type: 'TOGGLE_FEATURE', payload: { instanceKey, trackKey } });
    }, []);

    const handleArtistToggle = useCallback((instanceKey: string, trackKey: string, artistName: string) => {
        dispatch({ type: 'TOGGLE_ARTIST', payload: { instanceKey, trackKey, artistName } });
    }, []);

    const handleScrobbleModeToggle = useCallback((instanceKey: string, useTrackArtist: boolean) => {
        const item = queue.find(i => i.instanceKey === instanceKey);
        if (item) {
            dispatch({ type: 'TOGGLE_SCROBBLE_MODE', payload: { instanceKey, useTrackArtist, item } });
        }
    }, [queue]);

    const handleToggleParent = useCallback((instanceKey: string, parentIndex: number, subTrackKeys: string[]) => {
        dispatch({ type: 'TOGGLE_PARENT', payload: { instanceKey, subTrackKeys, parentKey: String(parentIndex) } });
    }, []);

    const handleSelectParentAsSingle = useCallback((instanceKey: string, parentKey: string, subTrackKeys: string[]) => {
        dispatch({ type: 'SELECT_PARENT_AS_SINGLE', payload: { instanceKey, parentKey, subTrackKeys } });
    }, []);
    
    const handleSelectAll = useCallback((instanceKey: string) => {
        const item = queue.find(i => i.instanceKey === instanceKey);
        if (item) {
            dispatch({ type: 'SELECT_ALL', payload: { instanceKey, item } });
        }
    }, [queue]);

    const handleDeselectAll = useCallback((instanceKey: string) => {
         dispatch({ type: 'DESELECT_ALL', payload: { instanceKey } });
    }, []);

    const handleToggleGroup = useCallback((instanceKey: string, groupKeys: string[], parentKeysInGroup: string[]) => {
        dispatch({ type: 'TOGGLE_GROUP', payload: { instanceKey, groupKeys, parentKeysInGroup } });
    }, []);

    const totalSelectedTracks = useMemo(() => {
        return Object.values(selectedTracks).reduce((acc, trackSet) => acc + trackSet.size, 0);
    }, [selectedTracks]);

    return {
        selectedTracks,
        selectedFeatures,
        artistSelections,
        totalSelectedTracks,
        initializeSelection,
        clearSelectionForInstance,
        resetSelections,
        handleTrackToggle,
        handleFeatureToggle,
        handleArtistToggle,
        handleScrobbleModeToggle,
        handleToggleParent,
        handleSelectParentAsSingle,
        handleSelectAll,
        handleDeselectAll,
        handleToggleGroup,
    };
}