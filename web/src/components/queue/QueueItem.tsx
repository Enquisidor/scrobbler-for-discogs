import React, { useState, useMemo } from 'react';
import type { QueueItem as QueueItemType, DiscogsTrack } from '../../libs';
import { Loader } from '../misc/Loader';
import { ChevronDownIcon, CloseIcon, CheckCircleIcon } from '../misc/Icons';
import IndeterminateCheckbox from './IndeterminateCheckbox';
import Track, { TrackPassthroughProps } from './Track';
import { assignGroups } from './utils/trackGroupUtils';
import { isVariousArtist, getReleaseDisplayArtist, getReleaseDisplayTitle } from '../../libs';

// QueueItemProps now extends the shared props interface, ensuring consistency
interface QueueItemProps extends TrackPassthroughProps {
    item: QueueItemType;
    onSelectAll: () => void;
    onDeselectAll: () => void;
    onToggleGroup: (groupKeys: string[], parentKeysInGroup: string[]) => void;
    onRemoveAlbumInstanceFromQueue: () => void;
    onScrobbleModeToggle: (useTrackArtist: boolean) => void;
    onScrobbleSingleRelease: () => void;
    isScrobbling: boolean;
}

const QueueItem: React.FC<QueueItemProps> = ({
    item,
    onSelectAll,
    onDeselectAll,
    onToggleGroup,
    onRemoveAlbumInstanceFromQueue,
    onScrobbleModeToggle,
    onScrobbleSingleRelease,
    isScrobbling,
    // Gather all props intended for Track via rest parameter
    ...trackPassthroughProps
}) => {
    // We destructured props needed by QueueItem from the rest parameter
    const {
        selectedTrackKeys,
        settings,
        metadata,
        onToggle,
        onToggleParent,
        isHistoryItem
    } = trackPassthroughProps;

    const [isExpanded, setIsExpanded] = useState(false);

    const artistName = getReleaseDisplayArtist(item, metadata, settings);
    const title = getReleaseDisplayTitle(item, metadata, settings);

    const isVarious = useMemo(() => {
        if (isVariousArtist(artistName)) return true;
        return item.basic_information.artists?.some(a => isVariousArtist(a.name)) ?? false;
    }, [artistName, item.basic_information.artists]);

    const processedTracklist = useMemo(() => {
        if (!isHistoryItem || !item.scrobbledTrackKeys || !item.tracklist) {
            return item.tracklist;
        }

        const scrobbledKeysSet = new Set(item.scrobbledTrackKeys);
        const newTracklist: DiscogsTrack[] = [];

        item.tracklist.forEach((track, pIndex) => {
            const trackKey = String(pIndex);

            if (track.sub_tracks && track.sub_tracks.length > 0) {
                if (scrobbledKeysSet.has(trackKey)) {
                    newTracklist.push({ ...track, sub_tracks: [] });
                    return;
                }

                const scrobbledSubTracks = track.sub_tracks.filter((_sub, sIndex) => {
                    const subKey = `${pIndex}-${sIndex}`;
                    return scrobbledKeysSet.has(subKey);
                });

                if (scrobbledSubTracks.length > 0) {
                    newTracklist.push({ ...track, sub_tracks: scrobbledSubTracks });
                }
            }
            else if (scrobbledKeysSet.has(trackKey)) {
                newTracklist.push(track);
            }
            else if (track.type_ === 'heading') {
                newTracklist.push(track);
            }
        });

        return newTracklist.filter((track, index, arr) => {
            if (track.type_ === 'heading') {
                const nextTrack = arr[index + 1];
                return nextTrack && nextTrack.type_ !== 'heading';
            }
            return true;
        });

    }, [isHistoryItem, item.tracklist, item.scrobbledTrackKeys]);

    const trackGroups = useMemo(() => assignGroups(processedTracklist), [processedTracklist]);

    const allSelectableKeys = useMemo(() => {
        const keys: string[] = [];
        item.tracklist?.forEach((track, pIndex) => {
            if (track.type_ === 'heading') return;
            // Safe access using optional chaining
            if (track.sub_tracks?.length) {
                track.sub_tracks.forEach((_, sIndex) => keys.push(`${pIndex}-${sIndex}`));
            } else {
                keys.push(String(pIndex));
            }
        });
        return keys;
    }, [item.tracklist]);

    const numSelected = selectedTrackKeys.size;
    const allTracksSelected = allSelectableKeys.length > 0 && numSelected === allSelectableKeys.length;

    const handleToggleAll = () => allTracksSelected ? onDeselectAll() : onSelectAll();

    return (
        <div className={`bg-gray-800 rounded-lg overflow-hidden ${item.error ? 'border border-red-800' : ''} ${isHistoryItem ? 'opacity-70' : ''}`}>
            <div className="w-full flex items-center justify-between p-4 text-left">
                <div
                    onClick={isHistoryItem ? undefined : () => setIsExpanded(!isExpanded)}
                    className={`flex-grow flex items-center gap-4 min-w-0 ${!isHistoryItem ? 'cursor-pointer' : ''}`}
                >
                    <img src={item.basic_information.cover_image} alt="" className="w-12 h-12 rounded-md object-cover flex-shrink-0" />
                    <div className="min-w-0">
                        <p className="font-bold truncate">{title}</p>
                        <p className="text-sm text-gray-400 truncate">{artistName}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    {item.error && <span className="text-xs text-red-400 font-bold px-2">Error</span>}
                    {!item.error && !isHistoryItem && selectedTrackKeys.size > 0 && <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">{selectedTrackKeys.size}</span>}
                    {isHistoryItem && item.scrobbledTrackCount && item.scrobbledTrackCount > 0 && <span className="bg-gray-600 text-white text-xs font-bold px-2 py-1 rounded-full">{item.scrobbledTrackCount}</span>}
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="p-1 rounded-full hover:bg-gray-700"
                        aria-label={isExpanded ? 'Collapse tracklist' : 'Expand tracklist'}
                    >
                        <ChevronDownIcon className={`w-6 h-6 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                    {!isHistoryItem && (
                        <>
                            <button
                                onClick={onScrobbleSingleRelease}
                                disabled={isScrobbling}
                                className="p-1 rounded-full hover:bg-gray-700 disabled:opacity-50 disabled:cursor-wait"
                                aria-label="Scrobble this release"
                                title="Scrobble this release"
                            >
                                <CheckCircleIcon className="w-6 h-6 text-green-500 hover:text-green-400" />
                            </button>
                            <button
                                onClick={onRemoveAlbumInstanceFromQueue}
                                className="p-1 rounded-full hover:bg-gray-700"
                                aria-label="Remove from queue"
                            >
                                <CloseIcon className="w-5 h-5 text-gray-400 hover:text-white" />
                            </button>
                        </>
                    )}
                </div>
            </div>
            {isExpanded && (
                <div className="px-4 pb-4">
                    {item.isLoading && <div className="flex justify-center py-4"><Loader /></div>}

                    {item.error && !isHistoryItem && (
                        <div className="bg-red-900/20 rounded-lg p-4 text-center">
                            <p className="text-red-400 text-sm mb-2 font-semibold">Failed to load album details.</p>
                            <p className="text-red-300 text-xs mb-4">{item.error}</p>
                            <button
                                onClick={onRemoveAlbumInstanceFromQueue}
                                className="bg-red-700 hover:bg-red-600 text-white text-xs font-bold py-2 px-4 rounded-full transition-colors"
                            >
                                Remove from Queue
                            </button>
                        </div>
                    )}

                    {!item.error && processedTracklist && (
                        <div className="pt-2 border-t border-gray-700">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-2 py-1">
                                {!isHistoryItem && (
                                    <label className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 cursor-pointer">
                                        <IndeterminateCheckbox disabled={isHistoryItem} checked={allTracksSelected} indeterminate={false} onChange={handleToggleAll} className="form-checkbox h-4 w-4 rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-800" />
                                        {allTracksSelected ? 'Deselect All Sides' : 'Select All Sides'}
                                    </label>
                                )}

                                {!isHistoryItem && isVarious && (
                                    <div className="flex items-center bg-gray-900/50 rounded-full px-3 py-1">
                                        <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                                            <span className="text-gray-500 uppercase font-bold tracking-wider" style={{ fontSize: '0.65rem' }}>Scrobble Mode:</span>
                                            <input
                                                type="checkbox"
                                                checked={item.useTrackArtist}
                                                onChange={(e) => onScrobbleModeToggle(e.target.checked)}
                                                className="form-checkbox h-3 w-3 rounded-sm bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-800"
                                            />
                                            {item.useTrackArtist ? 'Use Track Artists' : `Use "${artistName}"`}
                                        </label>
                                    </div>
                                )}
                            </div>

                            {trackGroups.map((group, groupIndex) => {
                                const selectableGroupKeys = group.tracks.flatMap(({ track, originalIndex: pIndex }) => {
                                    // Safe access using optional chaining
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
                                                {!isHistoryItem && (
                                                    <label className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 cursor-pointer">
                                                        <IndeterminateCheckbox checked={allInGroupSelected} indeterminate={someInGroupSelected} onChange={() => onToggleGroup(selectableGroupKeys, parentKeysInGroup)} className="form-checkbox h-4 w-4 rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-800" disabled={isHistoryItem || selectableGroupKeys.length === 0} />
                                                        {allInGroupSelected ? 'Deselect All on This Side' : 'Select All on This Side'}
                                                    </label>
                                                )}
                                            </div>
                                        )}
                                        <div className="space-y-1">
                                            {group.tracks.map(({ track, originalIndex }) => track.type_ !== 'heading' && (
                                                <Track
                                                    key={originalIndex}
                                                    track={track}
                                                    release={item}
                                                    parentIndex={originalIndex}
                                                    groupHeading={group.heading}
                                                    albumArtistName={artistName}
                                                    useTrackArtist={item.useTrackArtist}
                                                    {...trackPassthroughProps}
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
