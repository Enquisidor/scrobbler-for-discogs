import { useState, useMemo, useEffect } from 'react';
import type { QueueItem, SelectedTracks, SelectedFeatures, Settings } from '../types';

export function useTrackSelection(queue: QueueItem[], settings: Settings) {
    const [selectedTracks, setSelectedTracks] = useState<SelectedTracks>({});
    const [selectedFeatures, setSelectedFeatures] = useState<SelectedFeatures>({});

    useEffect(() => {
        // This effect synchronizes the feature selection state with the global settings,
        // ensuring the queue visually reflects the current preferences.
        setSelectedFeatures(currentSelectedFeatures => {
            const newSelectedFeatures: SelectedFeatures = {};
            let hasChanged = false;
    
            for (const item of queue) {
                const releaseId = item.id;
                const currentReleaseFeatures = currentSelectedFeatures[releaseId] || new Set();
                const newReleaseFeatures = new Set<string>();
    
                // Determine what the new feature set should be based on settings and selected tracks.
                if (settings.showFeatures && settings.selectFeaturesByDefault) {
                    const currentSelectedTracks = selectedTracks[releaseId];
                    if (currentSelectedTracks) {
                        for (const trackKey of currentSelectedTracks) {
                            const ids = trackKey.split('-').map(Number);
                            const parentTrack = item.tracklist?.[ids[0]];
                            const track = ids.length > 1 ? parentTrack?.sub_tracks?.[ids[1]] : parentTrack;
    
                            if (track?.featured_artists) {
                                newReleaseFeatures.add(trackKey);
                            }
                        }
                    }
                }
                // If settings are off, newReleaseFeatures remains an empty set, correctly deselecting all.
    
                // Compare with the current state to see if an update is needed for this release.
                if (currentReleaseFeatures.size !== newReleaseFeatures.size || 
                    ![...currentReleaseFeatures].every(key => newReleaseFeatures.has(key))) {
                    hasChanged = true;
                }
                
                newSelectedFeatures[releaseId] = newReleaseFeatures;
            }
    
            // Also check if any releases were removed from the queue entirely.
            if (!hasChanged) {
                const oldKeys = Object.keys(currentSelectedFeatures);
                const newKeys = queue.map(item => String(item.id));
                if (oldKeys.length !== newKeys.length || !oldKeys.every(k => newKeys.includes(k))) {
                    hasChanged = true;
                }
            }
    
            // Only update state if something actually changed to prevent re-render loops.
            return hasChanged ? newSelectedFeatures : currentSelectedFeatures;
        });
    }, [settings.selectFeaturesByDefault, settings.showFeatures, queue, selectedTracks]);

    const initializeSelection = (item: QueueItem) => {
        if (!settings.selectAllTracksPerRelease || !item.tracklist?.length) return;
        
        const newSelectedTracks = new Set<string>();
        const newSelectedFeatures = new Set<string>();

        item.tracklist.forEach((track, pIndex) => {
            if (track.type_ === 'heading') return;
            
            const hasSubTracks = track.sub_tracks && track.sub_tracks.length > 0;

            if (hasSubTracks) {
                if (settings.selectSubtracksByDefault) {
                    track.sub_tracks!.forEach((subTrack, sIndex) => {
                        const key = `${pIndex}-${sIndex}`;
                        newSelectedTracks.add(key);
                        if (settings.showFeatures && settings.selectFeaturesByDefault && subTrack.featured_artists) {
                            newSelectedFeatures.add(key);
                        }
                    });
                } else {
                    const key = String(pIndex);
                    newSelectedTracks.add(key);
                    if (settings.showFeatures && settings.selectFeaturesByDefault && track.featured_artists) {
                        newSelectedFeatures.add(key);
                    }
                }
            } else {
                const key = String(pIndex);
                newSelectedTracks.add(key);
                if (settings.showFeatures && settings.selectFeaturesByDefault && track.featured_artists) {
                    newSelectedFeatures.add(key);
                }
            }
        });
        
        setSelectedTracks(prev => ({ ...prev, [item.id]: newSelectedTracks }));
        setSelectedFeatures(prev => ({ ...prev, [item.id]: newSelectedFeatures }));
    };

    const clearSelection = (releaseId: number) => {
        setSelectedTracks(prevTracks => {
            const newTracks = { ...prevTracks };
            delete newTracks[releaseId];
            return newTracks;
        });
        setSelectedFeatures(prevFeatures => {
            const newFeatures = { ...prevFeatures };
            delete newFeatures[releaseId];
            return newFeatures;
        });
    };
    
    const resetSelections = () => {
        setSelectedTracks({});
        setSelectedFeatures({});
    };

    const handleTrackToggle = (releaseId: number, trackKey: string) => {
        const isAdding = !selectedTracks[releaseId]?.has(trackKey);

        setSelectedTracks(prev => {
            const releaseSet = new Set(prev[releaseId] || []);
            if (isAdding) releaseSet.add(trackKey);
            else releaseSet.delete(trackKey);
            return { ...prev, [releaseId]: releaseSet };
        });

        if (isAdding) {
            if (settings.showFeatures && settings.selectFeaturesByDefault) {
                const item = queue.find(i => i.id === releaseId);
                const ids = trackKey.split('-').map(Number);
                const parentTrack = item?.tracklist?.[ids[0]];
                const track = ids.length > 1 ? parentTrack?.sub_tracks?.[ids[1]] : parentTrack;
                
                if (track?.featured_artists) {
                    setSelectedFeatures(prev => {
                        const releaseSet = new Set(prev[releaseId] || []);
                        releaseSet.add(trackKey);
                        return { ...prev, [releaseId]: releaseSet };
                    });
                }
            }
        } else {
            setSelectedFeatures(prev => {
                const releaseSet = new Set(prev[releaseId] || []);
                releaseSet.delete(trackKey);
                return { ...prev, [releaseId]: releaseSet };
            });
        }
    };
    
    const handleFeatureToggle = (releaseId: number, trackKey: string) => {
        setSelectedFeatures(prev => {
            const releaseSet = new Set(prev[releaseId] || []);
            releaseSet.has(trackKey) ? releaseSet.delete(trackKey) : releaseSet.add(trackKey);
            return { ...prev, [releaseId]: releaseSet };
        });
    };

    const handleToggleParent = (releaseId: number, parentIndex: number, subTrackKeys: string[]) => {
        if (subTrackKeys.length === 0) return;
        
        const releaseSelectedSet = selectedTracks[releaseId] || new Set();
        const numSelectedSubtracks = subTrackKeys.filter(key => releaseSelectedSet.has(key)).length;
        const shouldSelectAllSubTracks = numSelectedSubtracks < subTrackKeys.length;
        
        const newSelectedTracks = new Set(releaseSelectedSet);
        const newSelectedFeatures = new Set(selectedFeatures[releaseId] || []);
        
        newSelectedTracks.delete(String(parentIndex)); 
        newSelectedFeatures.delete(String(parentIndex));

        const item = queue.find(i => i.id === releaseId);
        const parentTrack = item?.tracklist?.[parentIndex];
        
        if (shouldSelectAllSubTracks) {
            subTrackKeys.forEach(key => newSelectedTracks.add(key));
            if (settings.showFeatures && settings.selectFeaturesByDefault) {
                subTrackKeys.forEach(key => {
                    const sIndex = Number(key.split('-')[1]);
                    const subTrack = parentTrack?.sub_tracks?.[sIndex];
                    if (subTrack?.featured_artists) newSelectedFeatures.add(key);
                });
            }
        } else {
            subTrackKeys.forEach(key => {
                newSelectedTracks.delete(key);
                newSelectedFeatures.delete(key);
            });
        }
        
        setSelectedTracks(prev => ({...prev, [releaseId]: newSelectedTracks}));
        setSelectedFeatures(prev => ({...prev, [releaseId]: newSelectedFeatures}));
    };

    const handleSelectParentAsSingle = (releaseId: number, parentKey: string, subTrackKeys: string[]) => {
        const newSelectedTracks = new Set(selectedTracks[releaseId] || []);
        const newSelectedFeatures = new Set(selectedFeatures[releaseId] || []);
        
        subTrackKeys.forEach(key => {
            newSelectedTracks.delete(key);
            newSelectedFeatures.delete(key);
        });
        
        newSelectedTracks.add(parentKey);

        if (settings.showFeatures && settings.selectFeaturesByDefault) {
            const item = queue.find(i => i.id === releaseId);
            const parentTrack = item?.tracklist?.[Number(parentKey)];
            if(parentTrack?.featured_artists) newSelectedFeatures.add(parentKey);
        }

        setSelectedTracks(prev => ({ ...prev, [releaseId]: newSelectedTracks }));
        setSelectedFeatures(prev => ({ ...prev, [releaseId]: newSelectedFeatures }));
    };
    
    const handleSelectAll = (releaseId: number) => {
        const item = queue.find(i => i.id === releaseId);
        if (!item || !item.tracklist) return;

        const allKeys = new Set<string>();
        const allFeatures = new Set<string>();
        item.tracklist.forEach((track, pIndex) => {
            if (track.type_ === 'heading') return;
            if (track.sub_tracks && track.sub_tracks.length > 0) {
                track.sub_tracks.forEach((subTrack, sIndex) => {
                    const key = `${pIndex}-${sIndex}`;
                    allKeys.add(key);
                    if(subTrack.featured_artists) allFeatures.add(key);
                });
            } else {
                const key = String(pIndex);
                allKeys.add(key);
                if(track.featured_artists) allFeatures.add(key);
            }
        });
        setSelectedTracks(prev => ({ ...prev, [releaseId]: allKeys }));
        if (settings.showFeatures && settings.selectFeaturesByDefault) {
            setSelectedFeatures(prev => ({ ...prev, [releaseId]: allFeatures }));
        } else {
            setSelectedFeatures(prev => ({ ...prev, [releaseId]: new Set() }));
        }
    };

    const handleDeselectAll = (releaseId: number) => {
         setSelectedTracks(prev => ({ ...prev, [releaseId]: new Set() }));
         setSelectedFeatures(prev => ({ ...prev, [releaseId]: new Set() }));
    };

    const handleToggleGroup = (releaseId: number, groupKeys: string[], parentKeysInGroup: string[]) => {
        if (groupKeys.length === 0) return;

        const newSelectedTracks = new Set(selectedTracks[releaseId] || []);
        const newSelectedFeatures = new Set(selectedFeatures[releaseId] || []);
        const shouldSelectAll = groupKeys.some(key => !newSelectedTracks.has(key));

        if (shouldSelectAll) {
            parentKeysInGroup.forEach(parentKey => {
                newSelectedTracks.delete(parentKey);
                newSelectedFeatures.delete(parentKey);
            });
            groupKeys.forEach(key => newSelectedTracks.add(key));
            
            if (settings.showFeatures && settings.selectFeaturesByDefault) {
                const item = queue.find(i => i.id === releaseId);
                groupKeys.forEach(key => {
                    const ids = key.split('-').map(Number);
                    const pIndex = ids[0];
                    const sIndex = ids.length > 1 ? ids[1] : null;
                    const parentTrack = item?.tracklist?.[pIndex];
                    const track = sIndex !== null ? parentTrack?.sub_tracks?.[sIndex] : parentTrack;
                    if(track?.featured_artists) newSelectedFeatures.add(key);
                });
            }

        } else {
            groupKeys.forEach(key => {
                newSelectedTracks.delete(key);
                newSelectedFeatures.delete(key);
            });
        }
        setSelectedTracks(prev => ({ ...prev, [releaseId]: newSelectedTracks }));
        setSelectedFeatures(prev => ({ ...prev, [releaseId]: newSelectedFeatures }));
    };

    const totalSelectedTracks = useMemo(() => {
        return Object.values(selectedTracks).reduce((acc, trackSet) => acc + trackSet.size, 0);
    }, [selectedTracks]);

    return {
        selectedTracks,
        selectedFeatures,
        totalSelectedTracks,
        initializeSelection,
        clearSelection,
        resetSelections,
        handleTrackToggle,
        handleFeatureToggle,
        handleToggleParent,
        handleSelectParentAsSingle,
        handleSelectAll,
        handleDeselectAll,
        handleToggleGroup,
    };
}