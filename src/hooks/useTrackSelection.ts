import { useMemo, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { QueueItem, Settings } from '../types';
import type { RootState } from '../store/index';
import { 
  autoUpdateFeatures, 
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
  toggleGroup 
} from '../store/trackSelectionSlice';

export function useTrackSelection(queue: QueueItem[], settings: Settings) {
    const dispatch = useDispatch();
    const { selectedTracks, selectedFeatures, artistSelections } = useSelector((state: RootState) => state.trackSelection);

    useEffect(() => {
        dispatch(autoUpdateFeatures({ queue, settings, selectedTracks }));
    }, [settings.selectFeaturesByDefault, settings.showFeatures, queue, selectedTracks, dispatch]);

    const handleInitializeSelection = useCallback((item: QueueItem) => {
        dispatch(initializeSelection({ item, settings }));
    }, [settings, dispatch]);

    const handleClearSelectionForInstance = useCallback((instanceKey: string) => {
        dispatch(clearSelectionForInstance({ instanceKey }));
    }, [dispatch]);
    
    const handleResetSelections = useCallback(() => {
        dispatch(resetSelections());
    }, [dispatch]);

    const handleTrackToggle = useCallback((instanceKey: string, trackKey: string) => {
        dispatch(toggleTrack({ instanceKey, trackKey }));
    }, [dispatch]);
    
    const handleFeatureToggle = useCallback((instanceKey: string, trackKey: string) => {
        dispatch(toggleFeature({ instanceKey, trackKey }));
    }, [dispatch]);

    const handleArtistToggle = useCallback((instanceKey: string, trackKey: string, artistName: string) => {
        dispatch(toggleArtist({ instanceKey, trackKey, artistName }));
    }, [dispatch]);

    const handleScrobbleModeToggle = useCallback((instanceKey: string, useTrackArtist: boolean) => {
        const item = queue.find(i => i.instanceKey === instanceKey);
        if (item) {
            dispatch(toggleScrobbleMode({ instanceKey, useTrackArtist, item }));
        }
    }, [queue, dispatch]);

    const handleToggleParent = useCallback((instanceKey: string, parentIndex: number, subTrackKeys: string[]) => {
        dispatch(toggleParent({ instanceKey, subTrackKeys, parentKey: String(parentIndex) }));
    }, [dispatch]);

    const handleSelectParentAsSingle = useCallback((instanceKey: string, parentKey: string, subTrackKeys: string[]) => {
        dispatch(selectParentAsSingle({ instanceKey, parentKey, subTrackKeys }));
    }, [dispatch]);
    
    const handleSelectAll = useCallback((instanceKey: string) => {
        const item = queue.find(i => i.instanceKey === instanceKey);
        if (item) {
            dispatch(selectAll({ instanceKey, item }));
        }
    }, [queue, dispatch]);

    const handleDeselectAll = useCallback((instanceKey: string) => {
         dispatch(deselectAll({ instanceKey }));
    }, [dispatch]);

    const handleToggleGroup = useCallback((instanceKey: string, groupKeys: string[], parentKeysInGroup: string[]) => {
        dispatch(toggleGroup({ instanceKey, groupKeys, parentKeysInGroup }));
    }, [dispatch]);

    const totalSelectedTracks = useMemo(() => {
        return Object.values(selectedTracks).reduce((acc, trackSet) => acc + trackSet.size, 0);
    }, [selectedTracks]);

    return {
        selectedTracks,
        selectedFeatures,
        artistSelections,
        totalSelectedTracks,
        initializeSelection: handleInitializeSelection,
        clearSelectionForInstance: handleClearSelectionForInstance,
        resetSelections: handleResetSelections,
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