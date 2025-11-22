
import React, { useState, useMemo, useEffect } from 'react';
import type { QueueItem as QueueItemType, SelectedTracks, SelectedFeatures, Settings, ArtistSelections, AppleMusicMetadata } from '../../types';
import { Loader } from '../misc/Loader';
import { CloseIcon, VinylIcon } from '../misc/Icons';
import QueueItem from './QueueItem';
import { decomposeTimeOffset, formatTimeOffset, TIME_OFFSETS, TimeUnit, MAX_FUTURE_SECONDS, MAX_PAST_SECONDS } from './utils/timeOffsetUtils';

type TimeUnitValue = typeof TimeUnit[keyof typeof TimeUnit];

interface QueueSheetProps {
  isOpen: boolean;
  onClose: () => void;
  view: 'queue' | 'history';
  queue: QueueItemType[];
  selectedTracks: SelectedTracks;
  selectedFeatures: SelectedFeatures;
  artistSelections: ArtistSelections;
  scrobbleTimestamps: Record<string, Record<string, number>>;
  scrobbleTimeOffset: number;
  onScrobbleTimeOffsetChange: (offset: number) => void;
  settings: Settings;
  metadata: Record<number, AppleMusicMetadata>;
  onTrackToggle: (instanceKey: string, trackKey: string) => void;
  onFeatureToggle: (instanceKey: string, trackKey: string) => void;
  onArtistToggle: (instanceKey: string, trackKey: string, artistName: string) => void;
  onToggleParent: (instanceKey: string, parentIndex: number, subTrackKeys: string[]) => void;
  onSelectParentAsSingle: (instanceKey: string, parentKey: string, subTrackKeys: string[]) => void;
  onSelectAll: (instanceKey: string) => void;
  onDeselectAll: (instanceKey: string) => void;
  onToggleGroup: (instanceKey: string, groupKeys: string[], parentKeysInGroup: string[]) => void;
  onScrobble: () => void;
  isScrobbling: boolean;
  scrobbleError: string | null;
  totalSelectedTracks: number;
  onRemoveAlbumInstanceFromQueue: (instanceKey: string) => void;
  onScrobbleModeToggle?: (instanceKey: string, useTrackArtist: boolean) => void;
  isLastfmConnected: boolean;
  scrobbledHistory: QueueItemType[];
  onScrobbleSingleRelease: (instanceKey: string) => void;
}

export default function QueueSheet({
  isOpen,
  onClose,
  view,
  queue,
  selectedTracks,
  selectedFeatures,
  artistSelections,
  scrobbleTimestamps,
  scrobbleTimeOffset,
  onScrobbleTimeOffsetChange,
  settings,
  metadata,
  onTrackToggle,
  onFeatureToggle,
  onArtistToggle,
  onToggleParent,
  onSelectParentAsSingle,
  onSelectAll,
  onDeselectAll,
  onToggleGroup,
  onScrobble,
  isScrobbling,
  scrobbleError,
  totalSelectedTracks,
  onRemoveAlbumInstanceFromQueue,
  onScrobbleModeToggle,
  isLastfmConnected,
  scrobbledHistory,
  onScrobbleSingleRelease
}: QueueSheetProps) {
  const [isEditingTimeOffset, setIsEditingTimeOffset] = useState(false);
  const decomposed = useMemo(() => decomposeTimeOffset(scrobbleTimeOffset), [scrobbleTimeOffset]);
  const [editedTimeValue, setEditedTimeValue] = useState(decomposed.value);
  const [editedTimeUnit, setEditedTimeUnit] = useState<TimeUnitValue>(decomposed.unit);
  
  const itemsToDisplay = view === 'queue' ? queue : scrobbledHistory;
  
  const totalScrobbledAlbums = scrobbledHistory.length;
  const totalScrobbledTracks = useMemo(() => {
    return scrobbledHistory.reduce((acc, item) => acc + (item.scrobbledTrackCount || 0), 0);
  }, [scrobbledHistory]);

  const title = view === 'queue' 
    ? `Scrobble Queue (${queue.length})` 
    : `Scrobbled History (${totalScrobbledAlbums} Albums, ${totalScrobbledTracks} Tracks)`;

  useEffect(() => {
    if (!isEditingTimeOffset) {
        const { value, unit } = decomposeTimeOffset(scrobbleTimeOffset);
        setEditedTimeValue(value);
        setEditedTimeUnit(unit);
    }
  }, [scrobbleTimeOffset, isEditingTimeOffset]);

  const handleTimeEditCommit = () => {
    let multiplier = 60;
    if (editedTimeUnit === TimeUnit.HOUR) multiplier = 3600;
    if (editedTimeUnit === TimeUnit.DAY) multiplier = 86400;
    
    let totalSeconds = Math.round(editedTimeValue * multiplier);
    
    totalSeconds = Math.max(totalSeconds, -MAX_PAST_SECONDS);
    totalSeconds = Math.min(totalSeconds, MAX_FUTURE_SECONDS);

    onScrobbleTimeOffsetChange(totalSeconds);
    setIsEditingTimeOffset(false);
  };
  
  const handleTimeEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleTimeEditCommit();
    } else if (e.key === 'Escape') {
      setIsEditingTimeOffset(false);
    }
  };

  const sliderIndex = useMemo(() => {
    if (scrobbleTimeOffset === 0) return TIME_OFFSETS.findIndex(t => t.value === 0);
    const closestIndex = TIME_OFFSETS.reduce((prevIndex, curr, currIndex) => {
        const prevValue = TIME_OFFSETS[prevIndex].value;
        const prevDistance = Math.abs(prevValue - scrobbleTimeOffset);
        const currDistance = Math.abs(curr.value - scrobbleTimeOffset);
        return currDistance < prevDistance ? currIndex : prevIndex;
    }, 0);
    return closestIndex;
  }, [scrobbleTimeOffset]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const index = parseInt(e.target.value, 10);
    const offset = TIME_OFFSETS[index].value;
    onScrobbleTimeOffsetChange(offset);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-40 flex items-end" onClick={onClose}>
      <div 
        className="bg-gray-900 w-full max-w-4xl mx-auto h-[90vh] rounded-t-2xl flex flex-col shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <header className="p-4 border-b border-gray-700 flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-3">
            <VinylIcon className="w-6 h-6 text-gray-300"/>
            <h2 className="text-xl font-bold">{title}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-700">
            <CloseIcon className="w-6 h-6" />
          </button>
        </header>

        <main className="flex-grow p-4 overflow-y-auto space-y-4">
          {itemsToDisplay.length > 0 ? (
            itemsToDisplay.map(item => (
              <QueueItem
                key={item.instanceKey}
                item={item}
                selectedTrackKeys={new Set(selectedTracks[item.instanceKey] || [])}
                selectedFeatures={new Set(selectedFeatures[item.instanceKey] || [])}
                artistSelections={artistSelections[item.instanceKey] || {}}
                scrobbleTimestamps={scrobbleTimestamps[item.instanceKey] || {}}
                settings={settings}
                metadata={metadata[item.id]}
                onToggle={(trackKey) => onTrackToggle(item.instanceKey, trackKey)}
                onFeatureToggle={(trackKey) => onFeatureToggle(item.instanceKey, trackKey)}
                onArtistToggle={(trackKey, artistName) => onArtistToggle(item.instanceKey, trackKey, artistName)}
                onToggleParent={(parentIndex, subTrackKeys) => onToggleParent(item.instanceKey, parentIndex, subTrackKeys)}
                onSelectParentAsSingle={(parentKey, subTrackKeys) => onSelectParentAsSingle(item.instanceKey, parentKey, subTrackKeys)}
                onSelectAll={() => onSelectAll(item.instanceKey)}
                onDeselectAll={() => onDeselectAll(item.instanceKey)}
                onToggleGroup={(groupKeys, parentKeys) => onToggleGroup(item.instanceKey, groupKeys, parentKeys)}
                onRemoveAlbumInstanceFromQueue={() => onRemoveAlbumInstanceFromQueue(item.instanceKey)}
                onScrobbleModeToggle={(useTrackArtist) => onScrobbleModeToggle?.(item.instanceKey, useTrackArtist)}
                isHistoryItem={view === 'history'}
                onScrobbleSingleRelease={() => onScrobbleSingleRelease(item.instanceKey)}
                isScrobbling={isScrobbling}
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <p>{view === 'queue' ? 'Your queue is empty.' : 'Your scrobble history for this session is empty.'}</p>
              <p className="text-sm">Select albums from your collection to add them here.</p>
            </div>
          )}
        </main>

        {view === 'queue' && (
            <footer className="p-4 border-t border-gray-700 flex-shrink-0 flex flex-col gap-2">
                <div className="grid grid-cols-[auto,1fr] items-center gap-4">
                    <span className="font-semibold text-gray-300">When?</span>
                    <input
                        type="range"
                        min="0"
                        max={TIME_OFFSETS.length - 1}
                        value={sliderIndex}
                        onChange={handleSliderChange}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                </div>

                <div className="flex justify-end h-6 items-center">
                    {isEditingTimeOffset ? (
                        <div
                            className="flex items-center gap-2"
                            onBlur={(e) => {
                                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                                    handleTimeEditCommit();
                                }
                            }}
                        >
                            <input
                                type="number"
                                value={editedTimeValue}
                                onChange={(e) => setEditedTimeValue(Number(e.target.value))}
                                onKeyDown={handleTimeEditKeyDown}
                                autoFocus
                                className="bg-gray-700 text-gray-200 text-sm text-right px-2 py-1 rounded-md w-20 focus:outline-none focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <select
                                value={editedTimeUnit}
                                onChange={(e) => setEditedTimeUnit(e.target.value as TimeUnitValue)}
                                className="bg-gray-700 text-gray-200 text-sm px-1 py-1 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value={TimeUnit.MINUTE}>minutes</option>
                                <option value={TimeUnit.HOUR}>hours</option>
                                <option value={TimeUnit.DAY}>days</option>
                            </select>
                        </div>
                    ) : (
                        <p
                            onClick={() => setIsEditingTimeOffset(true)}
                            className="text-sm text-gray-400 cursor-pointer hover:text-white transition-colors"
                            title="Click to edit precisely"
                        >
                            {formatTimeOffset(scrobbleTimeOffset)}
                        </p>
                    )}
                </div>

                {scrobbleError && <p className="text-red-400 text-sm text-center">{scrobbleError}</p>}
                
                <button
                    onClick={onScrobble}
                    disabled={!isLastfmConnected || isScrobbling || totalSelectedTracks === 0}
                    className="w-full bg-brand-lastfm hover:bg-red-700 text-white font-bold py-3 px-4 rounded-full flex items-center justify-center gap-2 transition-colors disabled:bg-brand-lastfm disabled:text-gray-900 disabled:cursor-not-allowed"
                    title={!isLastfmConnected ? "Connect Last.fm to scrobble" : ""}
                >
                    {isScrobbling ? <Loader /> : `Scrobble ${totalSelectedTracks} ${totalSelectedTracks === 1 ? 'Track' : 'Tracks'}`}
                </button>
            </footer>
        )}
      </div>
    </div>
  );
}