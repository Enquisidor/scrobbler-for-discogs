import { useState, useMemo, useEffect } from 'react';
import type { QueueItem, SelectedTracks, SelectedFeatures, Settings, ArtistSelections } from '../types';
import { getTrackFeaturedArtists } from './utils/queueUtils';
import { cleanArtistName } from './utils/formattingUtils';

export function useTrackSelection(queue: QueueItem[], settings: Settings) {
    const [selectedTracks, setSelectedTracks] = useState<SelectedTracks>({});
    const [selectedFeatures, setSelectedFeatures] = useState<SelectedFeatures>({});
    const [artistSelections, setArtistSelections] = useState<ArtistSelections>({});

    console.log('[TrackSelection] Hook running/re-rendering.');

    useEffect(() => {
        console.log('[TrackSelection] Feature selection useEffect triggered.', {
            selectFeaturesByDefault: settings.selectFeaturesByDefault,
            showFeatures: settings.showFeatures,
            queueLength: queue.length,
        });

        setSelectedFeatures(currentSelectedFeatures => {
            const newSelectedFeatures: SelectedFeatures = {};
            let hasChanged = false;
    
            for (const item of queue) {
                const instanceKey = item.instanceKey;
                const currentInstanceFeatures = currentSelectedFeatures[instanceKey] || new Set();
                const newInstanceFeatures = new Set<string>();
    
                if (settings.showFeatures && settings.selectFeaturesByDefault) {
                    const currentSelectedTracks = selectedTracks[instanceKey];
                    if (currentSelectedTracks) {
                        for (const trackKey of currentSelectedTracks) {
                            const ids = trackKey.split('-').map(Number);
                            const parentTrack = item.tracklist?.[ids[0]];
                            const track = ids.length > 1 ? parentTrack?.sub_tracks?.[ids[1]] : parentTrack;
                            
                            if (track) {
                                const features = getTrackFeaturedArtists(track);
                                if (features) {
                                    newInstanceFeatures.add(trackKey);
                                }
                            }
                        }
                    }
                }
    
                if (currentInstanceFeatures.size !== newInstanceFeatures.size || 
                    ![...currentInstanceFeatures].every(key => newInstanceFeatures.has(key))) {
                    hasChanged = true;
                }
                
                newSelectedFeatures[instanceKey] = newInstanceFeatures;
            }
    
            if (!hasChanged) {
                const oldKeys = Object.keys(currentSelectedFeatures);
                const newKeys = queue.map(item => item.instanceKey);
                if (oldKeys.length !== newKeys.length || !oldKeys.every(k => newKeys.includes(k))) {
                    hasChanged = true;
                }
            }
    
            if (hasChanged) {
                console.log('[TrackSelection] Feature selections have changed and will be updated.');
            }
            return hasChanged ? newSelectedFeatures : currentSelectedFeatures;
        });
    }, [settings.selectFeaturesByDefault, settings.showFeatures, queue, selectedTracks]);

    const initializeSelection = (item: QueueItem) => {
        console.log(`[TrackSelection] ACTION: initializeSelection for "${item.basic_information.title}" (key: ${item.instanceKey})`);
        const instanceKey = item.instanceKey;
        if (settings.selectAllTracksPerRelease && item.tracklist?.length) {
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
            
            setSelectedTracks(prev => ({ ...prev, [instanceKey]: newSelectedTracks }));
            setSelectedFeatures(prev => ({ ...prev, [instanceKey]: newSelectedFeatures }));
        }

        if (item.tracklist?.length) {
             const newArtistSelections: Record<string, Set<string>> = {};
             item.tracklist.forEach((track, pIndex) => {
                const processTrack = (t: any, key: string) => {
                    const selectedSet = new Set<string>();
                    if (t.artists) {
                        t.artists.forEach((a: any) => selectedSet.add(cleanArtistName(a.name)));
                    }
                    if (settings.showFeatures && settings.selectFeaturesByDefault && t.extraartists) {
                        t.extraartists
                            .filter((a: any) => a.role.toLowerCase().includes('feat'))
                            .forEach((a: any) => selectedSet.add(cleanArtistName(a.name)));
                    }
                    if (selectedSet.size > 0) newArtistSelections[key] = selectedSet;
                };
                if (track.sub_tracks && track.sub_tracks.length > 0) {
                    track.sub_tracks.forEach((sub, sIndex) => processTrack(sub, `${pIndex}-${sIndex}`));
                } 
                processTrack(track, String(pIndex));
             });
             setArtistSelections(prev => ({ ...prev, [instanceKey]: newArtistSelections }));
        }
    };

    const clearSelectionForInstance = (instanceKey: string) => {
        console.log(`[TrackSelection] ACTION: clearSelectionForInstance for key: ${instanceKey}`);
        setSelectedTracks(prev => { const copy = { ...prev }; delete copy[instanceKey]; return copy; });
        setSelectedFeatures(prev => { const copy = { ...prev }; delete copy[instanceKey]; return copy; });
        setArtistSelections(prev => { const copy = { ...prev }; delete copy[instanceKey]; return copy; });
    };
    
    const resetSelections = () => {
        console.log('[TrackSelection] ACTION: resetSelections (clearing all selections).');
        setSelectedTracks({});
        setSelectedFeatures({});
        setArtistSelections({});
    };

    const handleTrackToggle = (instanceKey: string, trackKey: string) => {
        const isAdding = !selectedTracks[instanceKey]?.has(trackKey);
        console.log(`[TrackSelection] ACTION: handleTrackToggle (${isAdding ? 'adding' : 'removing'})`, { instanceKey, trackKey });

        setSelectedTracks(prev => {
            const instanceSet = new Set(prev[instanceKey] || []);
            if (isAdding) instanceSet.add(trackKey);
            else instanceSet.delete(trackKey);
            return { ...prev, [instanceKey]: instanceSet };
        });
        
        if (!isAdding) {
             setSelectedFeatures(prev => {
                const instanceSet = new Set(prev[instanceKey] || []);
                instanceSet.delete(trackKey);
                return { ...prev, [instanceKey]: instanceSet };
            });
        }
    };
    
    const handleFeatureToggle = (instanceKey: string, trackKey: string) => {
        console.log(`[TrackSelection] ACTION: handleFeatureToggle for`, { instanceKey, trackKey });
        setSelectedFeatures(prev => {
            const instanceSet = new Set(prev[instanceKey] || []);
            instanceSet.has(trackKey) ? instanceSet.delete(trackKey) : instanceSet.add(trackKey);
            return { ...prev, [instanceKey]: instanceSet };
        });
    };

    const handleArtistToggle = (instanceKey: string, trackKey: string, artistName: string) => {
        console.log(`[TrackSelection] ACTION: handleArtistToggle for`, { instanceKey, trackKey, artistName });
        setArtistSelections(prev => {
            const instanceMap = { ...(prev[instanceKey] || {}) };
            const trackSet = new Set(instanceMap[trackKey] || []);
            trackSet.has(artistName) ? trackSet.delete(artistName) : trackSet.add(artistName);
            instanceMap[trackKey] = trackSet;
            return { ...prev, [instanceKey]: instanceMap };
        });
    };

    const handleScrobbleModeToggle = (instanceKey: string, useTrackArtist: boolean) => {
        console.log(`[TrackSelection] ACTION: handleScrobbleModeToggle to ${useTrackArtist ? 'Track Artists' : 'Album Artist'}`, { instanceKey });
        const item = queue.find(i => i.instanceKey === instanceKey);
        if (!item || !item.tracklist) return;

        setArtistSelections(prev => {
            const instanceMap = { ...(prev[instanceKey] || {}) };
            const processTrack = (t: any, key: string) => {
                const currentSet = new Set(instanceMap[key] || []);
                if (t.artists) {
                    t.artists.forEach((a: any) => {
                        const name = cleanArtistName(a.name);
                        if (useTrackArtist) currentSet.add(name);
                        else currentSet.delete(name);
                    });
                }
                instanceMap[key] = currentSet;
            };
            item.tracklist!.forEach((track, pIndex) => {
                 if (track.sub_tracks) track.sub_tracks.forEach((sub, sIndex) => processTrack(sub, `${pIndex}-${sIndex}`));
                 processTrack(track, String(pIndex));
            });
            return { ...prev, [instanceKey]: instanceMap };
        });
    };

    const handleToggleParent = (instanceKey: string, parentIndex: number, subTrackKeys: string[]) => {
        console.log(`[TrackSelection] ACTION: handleToggleParent for`, { instanceKey, parentIndex });
        if (subTrackKeys.length === 0) return;
        const selectedSet = selectedTracks[instanceKey] || new Set();
        const numSelectedSubtracks = subTrackKeys.filter(key => selectedSet.has(key)).length;
        const shouldSelectAllSubTracks = numSelectedSubtracks < subTrackKeys.length;
        
        const newSelectedTracks = new Set(selectedSet);
        const newSelectedFeatures = new Set(selectedFeatures[instanceKey] || []);
        newSelectedTracks.delete(String(parentIndex)); 
        newSelectedFeatures.delete(String(parentIndex));

        if (shouldSelectAllSubTracks) subTrackKeys.forEach(key => newSelectedTracks.add(key));
        else subTrackKeys.forEach(key => { newSelectedTracks.delete(key); newSelectedFeatures.delete(key); });
        
        setSelectedTracks(prev => ({...prev, [instanceKey]: newSelectedTracks}));
        setSelectedFeatures(prev => ({...prev, [instanceKey]: newSelectedFeatures}));
    };

    const handleSelectParentAsSingle = (instanceKey: string, parentKey: string, subTrackKeys: string[]) => {
        console.log(`[TrackSelection] ACTION: handleSelectParentAsSingle for`, { instanceKey, parentKey });
        const newSelectedTracks = new Set(selectedTracks[instanceKey] || []);
        subTrackKeys.forEach(key => newSelectedTracks.delete(key));
        newSelectedTracks.add(parentKey);
        setSelectedTracks(prev => ({ ...prev, [instanceKey]: newSelectedTracks }));
    };
    
    const handleSelectAll = (instanceKey: string) => {
        console.log(`[TrackSelection] ACTION: handleSelectAll for`, { instanceKey });
        const item = queue.find(i => i.instanceKey === instanceKey);
        if (!item || !item.tracklist) return;
        const allKeys = new Set<string>();
        item.tracklist.forEach((track, pIndex) => {
            if (track.type_ === 'heading') return;
            if (track.sub_tracks?.length) track.sub_tracks.forEach((_, sIndex) => allKeys.add(`${pIndex}-${sIndex}`));
            else allKeys.add(String(pIndex));
        });
        setSelectedTracks(prev => ({ ...prev, [instanceKey]: allKeys }));
    };

    const handleDeselectAll = (instanceKey: string) => {
        console.log(`[TrackSelection] ACTION: handleDeselectAll for`, { instanceKey });
         setSelectedTracks(prev => ({ ...prev, [instanceKey]: new Set() }));
    };

    const handleToggleGroup = (instanceKey: string, groupKeys: string[], parentKeysInGroup: string[]) => {
        console.log(`[TrackSelection] ACTION: handleToggleGroup for`, { instanceKey });
        if (groupKeys.length === 0) return;
        const newSelectedTracks = new Set(selectedTracks[instanceKey] || []);
        const shouldSelectAll = groupKeys.some(key => !newSelectedTracks.has(key));

        if (shouldSelectAll) {
            parentKeysInGroup.forEach(k => newSelectedTracks.delete(k));
            groupKeys.forEach(key => newSelectedTracks.add(key));
        } else {
            groupKeys.forEach(key => newSelectedTracks.delete(key));
        }
        setSelectedTracks(prev => ({ ...prev, [instanceKey]: newSelectedTracks }));
    };

    const totalSelectedTracks = useMemo(() => {
        const total = Object.values(selectedTracks).reduce((acc, trackSet) => acc + trackSet.size, 0);
        console.log('[TrackSelection] Recalculating totalSelectedTracks:', total);
        return total;
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