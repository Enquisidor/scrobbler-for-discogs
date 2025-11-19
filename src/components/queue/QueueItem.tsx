import React, { useState, useMemo } from 'react';
import type { QueueItem as QueueItemType, EnrichedTrack, Settings } from '../../types';
import { Loader } from '../misc/Loader';
import { ChevronDownIcon, CloseIcon } from '../misc/Icons';
import IndeterminateCheckbox from './IndeterminateCheckbox';
import Track from './Track';
import { assignGroups } from './utils/trackGroupUtils';

interface QueueItemProps {
    item: QueueItemType;
    selectedTrackKeys: Set<string>;
    selectedFeatures: Set<string>;
    scrobbleTimestamps: Record<string, number>;
    settings: Settings;
    onToggle: (trackKey: string) => void;
    onFeatureToggle: (trackKey: string) => void;
    onToggleParent: (parentIndex: number, subTrackKeys: string[]) => void;
    onSelectParentAsSingle: (parentKey: string, subTrackKeys: string[]) => void;
    onSelectAll: () => void;
    onDeselectAll: () => void;
    onToggleGroup: (groupKeys: string[], parentKeysInGroup: string[]) => void;
    onRemoveAlbumFromQueue: () => void;
}

const QueueItem: React.FC<QueueItemProps> = ({ 
    item, 
    selectedTrackKeys,
    selectedFeatures,
    scrobbleTimestamps,
    settings,
    onToggle,
    onFeatureToggle,
    onToggleParent, 
    onSelectParentAsSingle, 
    onSelectAll, 
    onDeselectAll, 
    onToggleGroup,
    onRemoveAlbumFromQueue
}) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const artistName = item.basic_information.artist_display_name;
    
    const trackGroups = useMemo(() => assignGroups(item.tracklist), [item.tracklist]);

    const allSelectableKeys = useMemo(() => {
        const keys: string[] = [];
        item.tracklist?.forEach((track, pIndex) => {
            if (track.type_ === 'heading') return;
            if (track.sub_tracks && track.sub_tracks.length > 0) {
                 track.sub_tracks.forEach((_, sIndex) => keys.push(`${pIndex}-${sIndex}`));
            } else {
                keys.push(String(pIndex));
            }
        });
        return keys;
    }, [item.tracklist]);

    const numSelected = selectedTrackKeys.size;
    const allTracksSelected = allSelectableKeys.length > 0 && numSelected === allSelectableKeys.length;
    const someTracksSelected = numSelected > 0 && numSelected < allSelectableKeys.length;

    const handleToggleAll = () => allTracksSelected ? onDeselectAll() : onSelectAll();

    return (
        <div className="bg-gray-800 rounded-lg overflow-hidden">
            <div className="w-full flex items-center justify-between p-4 text-left">
                <div 
                    onClick={() => setIsExpanded(!isExpanded)} 
                    className="flex-grow flex items-center gap-4 min-w-0 cursor-pointer"
                >
                    <img src={item.basic_information.cover_image} alt="" className="w-12 h-12 rounded-md object-cover flex-shrink-0" />
                    <div className="min-w-0">
                        <p className="font-bold truncate">{item.basic_information.title}</p>
                        <p className="text-sm text-gray-400 truncate">{artistName}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    {selectedTrackKeys.size > 0 && <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">{selectedTrackKeys.size}</span>}
                    <button 
                        onClick={() => setIsExpanded(!isExpanded)} 
                        className="p-1 rounded-full hover:bg-gray-700" 
                        aria-label={isExpanded ? 'Collapse tracklist' : 'Expand tracklist'}
                    >
                        <ChevronDownIcon className={`w-6 h-6 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                    <button 
                        onClick={onRemoveAlbumFromQueue} 
                        className="p-1 rounded-full hover:bg-gray-700"
                        aria-label="Remove from queue"
                    >
                        <CloseIcon className="w-5 h-5 text-gray-400 hover:text-white" />
                    </button>
                </div>
            </div>
            {isExpanded && (
                <div className="px-4 pb-4">
                    {item.isLoading && <div className="flex justify-center py-4"><Loader/></div>}
                    {item.tracklist && (
                        <div className="pt-2 border-t border-gray-700">
                             <div className="flex justify-start px-2 py-1">
                                <label className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 cursor-pointer">
                                    <IndeterminateCheckbox checked={allTracksSelected} indeterminate={someTracksSelected} onChange={handleToggleAll} className="form-checkbox h-4 w-4 rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-800"/>
                                    {allTracksSelected ? 'Deselect All Sides' : 'Select All Sides'}
                                </label>
                            </div>
                            {trackGroups.map((group, groupIndex) => {
                                const selectableGroupKeys = group.tracks.flatMap(({ track, originalIndex: pIndex }) => {
                                     if (track.sub_tracks?.length) return track.sub_tracks.map((_, sIndex) => `${pIndex}-${sIndex}`);
                                     if (track.type_ !== 'heading') return [String(pIndex)];
                                     return [];
                                });
                                const parentKeysInGroup = group.tracks
                                    .filter(({ track }) => track.sub_tracks && track.sub_tracks.length > 0)
                                    .map(({ originalIndex }) => String(originalIndex));

                                const numSelectedInGroup = selectableGroupKeys.filter(key => selectedTrackKeys.has(key)).length;
                                const allInGroupSelected = selectableGroupKeys.length > 0 && numSelectedInGroup === selectableGroupKeys.length;
                                const someInGroupSelected = numSelectedInGroup > 0 && numSelectedInGroup < selectableGroupKeys.length;
                                
                                return (
                                <div key={group.heading || groupIndex} className="mt-2">
                                    {group.heading && (
                                    <div className="flex justify-between items-baseline mb-1 px-2">
                                        <h4 className="font-bold text-sm text-gray-400">{group.heading}</h4>
                                        <label className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 cursor-pointer">
                                            <IndeterminateCheckbox checked={allInGroupSelected} indeterminate={someInGroupSelected} onChange={() => onToggleGroup(selectableGroupKeys, parentKeysInGroup)} className="form-checkbox h-4 w-4 rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-800" disabled={selectableGroupKeys.length === 0}/>
                                            {allInGroupSelected ? 'Deselect All on This Side' : 'Select All on This Side'}
                                        </label>
                                    </div>
                                    )}
                                    <div className="space-y-1">
                                        {group.tracks.map(({ track, originalIndex }) => track.type_ !== 'heading' && (
                                            <Track
                                                key={originalIndex}
                                                track={track}
                                                parentIndex={originalIndex}
                                                groupHeading={group.heading}
                                                albumArtistName={artistName}
                                                selectedTrackKeys={selectedTrackKeys}
                                                selectedFeatures={selectedFeatures}
                                                scrobbleTimestamps={scrobbleTimestamps}
                                                settings={settings}
                                                onToggle={onToggle}
                                                onFeatureToggle={onFeatureToggle}
                                                onToggleParent={onToggleParent}
                                                onSelectParentAsSingle={onSelectParentAsSingle}
                                            />
                                        ))}
                                    </div>
                                </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default QueueItem;